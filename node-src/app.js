const {Machine} = require("./machines");
const {vncDisplayArguments, MACHINE_HOST} = require("./helpers/VncDisplay");
const express = require('express');
const app = express();
const pidusage = require('pidusage')
const fs = require("node:fs");
const md5 = require("md5");
const QemuOpenCoreRunnable = require("./OpenCoreRunnable");
const {createRandomMacOSHDD} = require("./utils/serialDisk");
const {logger} = require("./logger");
const {vms} = require("./vms");
const basicAuth = require('express-basic-auth')
const path = require("node:path");
const audit = require('express-requests-logger')
const {ImgCreator} = require("./helpers/ImgCreator");
const _ = require("lodash");
const Ajv = require("ajv")
const {config} = require("./config");
const os = require("node:os");
const disk = require("diskusage");

const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

app.use(express.json());
app.use(audit({
	logger
}))

app.use('/public', express.static(process.cwd() + '/public'))

if (fs.existsSync(process.cwd() + "/http.json")) {
	const httpConf = JSON.parse(String(fs.readFileSync(process.cwd() + "/http.json")))

	if (httpConf.hasOwnProperty('users')) {
		logger.debug('use http auth')

		Object.keys(httpConf.users).forEach(user => logger.debug(`use "${user}" user for auth`))

		app.use(basicAuth({
			users: httpConf.users
		}))
	}
}

app.set('views', process.cwd() + '/views');
app.set('view engine', 'jsx');

app.engine('jsx', require('express-react-views').createEngine());

if (!fs.existsSync('.vnc-port')) {
	fs.writeFileSync('.vnc-port', "1")
}

app.get('/', function(req, res){
	res.render('index', {
		vms: Object.entries(vms).map(pair => ({
			name: pair[0],
			vm: pair[1],
		}))
	});
});

app.get('/api/vms/list', function(req, res){
	res.json(
		Object.entries(vms).map(pair => ({
			name: pair[0],
			vm: pair[1],
		}))
	)
});

app.get('/api/resources/disks/list', async (req, res) => {
	const files = fs.readdirSync(process.cwd() + '/disks').map(img => {
		const stat = fs.statSync(process.cwd() + '/disks/' + img)
		return {
			name: img,
			sizeInMb: stat.size / (1024*1024),
			stat
		}
	})

	res.json(files)
});

app.get('/api/resources/snapshots/list', async (req, res) => {
	const files = fs.readdirSync(process.cwd() + '/.snapshots').map(snapshot => {
		const snapshotFilePath = path.normalize(process.cwd() + '/.snapshots/' + snapshot)

		return {
			name: snapshot,
			data: JSON.parse(String(fs.readFileSync(snapshotFilePath)))
		}
	})

	res.json(files)
});

app.get('/api/vms/:name/stdout', (req, res) => {
	const name = req.params.name;
	const filePath = process.cwd() + `/.cache/stdout_${md5(name)}.log`

	if (!fs.existsSync(filePath)) {
		res.set('Content-Type', 'text/html');
		res.status(404)

		return res.send(`VM '${name}' not found`);
	}

	const stdout = String(fs.readFileSync(filePath))

	res.set('Content-Type', 'text/html');
	res.status(200)

	return res.send(stdout);
});

app.post('/api/vms/create', async (req, res) => {
	const { name, version } = req.body;

	const info = disk.checkSync(process.cwd());
	const freeInGB = info.free / 1024 / 1024 / 1024

	const snapshotFilePath = path.normalize(process.cwd() + '/.snapshots/' + md5(name) + '.json')
	const hddSrc = path.normalize(process.cwd() + `/data/hdd/DATA_${name}.img`)
	const bootdiskSrc = path.normalize(process.cwd() + `/data/bootable/BOOT_${name}.qcow2`)

	if (!['ventura', 'sonoma'].includes(version)) {
		return res.status(400).json({
			error: `this generation (${version}) of virtual machines is not supported`
		})
	}

	if (!/^[a-zA-Z]+$/.test(name)) {
		return res.status(400).json({
			error: `virtual machine name is incorrect. it can be specified exclusively in English characters, without special characters, spaces or numbers`
		})
	}

	if (freeInGB < _.get(config, 'reservedSize.min', 30)) {
		logger.error("attention! There is not enough space on your device to create a virtual disk")

		return res.status(500).json({
			error: `there is not enough free space on the device to create and then fill a hard disk. need ${_.get(config, 'reservedSize.min', 30)}GB, you have ${freeInGB}GB`
		});
	}


	if (fs.existsSync(snapshotFilePath)) {
		return res.status(500).json({
			error: `virtual machine named '${name}' already exists and can only be launched via the run command`
		});
	}

	const port = parseInt(String(fs.readFileSync('.vnc-port')))
	const newVncPort = String(port + _.get(config, 'vncEveryNewInstanceStep', 1))

	fs.writeFileSync('.vnc-port', newVncPort)

	const vncArgs = Object.freeze({
		host: MACHINE_HOST,
		port: newVncPort
	})

	if (typeof vms[name] != "undefined") {
		return res.status(500).json({
			error: `virtual machine named "${name}" has already been created and is running`
		})
	}


	const imageCreator = new ImgCreator(
		hddSrc,
		_.get(
			config,
			'defaultMacStorageSize',
			'256G'
		)
	)

	await imageCreator.createImage()

	fs.accessSync(hddSrc)

	const opt = {
		onStdoutData: function (byte) {
			fs.appendFileSync(process.cwd() + `/.tty/stdout_${md5(name)}.log`, byte)
		},

		onStdinData: function (byte) {
			fs.appendFileSync(process.cwd() + `/.tty/stdin_${md5(name)}.log`, byte)
		},

		...vncDisplayArguments(vncArgs),
	}

	let proc

	switch (version) {
		case 'sonoma':
			proc = await Machine.sonoma(opt, hddSrc, bootdiskSrc)
			break;

		case 'ventura':
			proc = await Machine.ventura(opt, hddSrc, bootdiskSrc)
			break;

		default:
			throw "unsupported OS version"
	}

	fs.writeFileSync(
		snapshotFilePath,
		JSON.stringify({
			creationDate: new Date(),

			snapshotFilePath,
			vncArgs,
			name,

			argv: proc.qemu.getArgs(),
		}, null, 2),
	)

	const runnable = proc.qemu.run()

	vms[name] = Object.freeze({
		proc: proc.qemu,
		runnable
	})

	pidusage(runnable.pid).then(i => {
		res.json({
			name,
			process: i,
			vncArgs
		})
	})
});

app.post('/api/vms/:name/start', (req, res) => {
	const name = req.params.name;
	const snapshotFilePath = process.cwd() + '/.snapshots/' + md5(name) + '.json'

	if (typeof vms[name] != "undefined") {
		return res.status(500).json({
			error: 'such a VM already exists and is running'
		});
	}

	if (!fs.existsSync(snapshotFilePath)) {
		return res.status(404).json({
			error: `vm "${name}" not found`
		});
	}

	const proc = new QemuOpenCoreRunnable({
		onStdoutData: function (byte) {
			fs.appendFileSync(process.cwd() + `/.cache/stdout_${md5(name)}.log`, byte)
		},

		onStdinData: function (byte) {
			fs.appendFileSync(process.cwd() + `/.cache/stdin_${md5(name)}.log`, byte)
		},
	})

	proc.setArgs(require(snapshotFilePath).argv)

	const runnable = proc.run()

	vms[name] = Object.freeze({
		proc,
		runnable
	})

	pidusage(runnable.pid).then(i => {
		res.json({
			name,
			process: i
		})
	})
});

app.post('/api/vms/:name/stop', (req, res) => {
	const name = req.params.name;
	const snapshotFilePath = process.cwd() + '/.snapshots/' + md5(name) + '.json'

	if (!fs.existsSync(snapshotFilePath)) {
		return res.status(404).json({
			message: `vm "${name}" not found`
		});
	}

	if (vms[name]) {
		vms[name].runnable.kill(9)

		pidusage(vms[name].runnable.pid)
			.then(i => {

			})
			.catch((i) => {
				res.json({
					name,
					process: i
				})

				delete vms[name]
			})
	}
});

function spawnWebServer(
	host = process.env.HOST || '0.0.0.0',
	port = process.env.PORT || 3000
) {
	app.listen(port, host, () => {
		logger.info(`server is running and accessible at address tcp://${host}:${port}`)
	});

}

module.exports = {
	app,
	spawnWebServer
}