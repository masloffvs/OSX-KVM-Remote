const banner = ('CuKWiOKWiOKVl-KWkeKWkeKWiOKWiOKVl-KWiOKWiOKVl-KWkeKWkeKWkeKWiOKWiOKVl-KWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKVl-KWkeKWkeKWkeKWiOKWiOKVl-KWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkQrilojilojilZHilpHilpHilojilojilZHilZrilojilojilZfilpHilojilojilZTilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZTilZDilZDilZDilZDilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZHilpHilpHilpHilojilojilZHilojilojilZHilojilojilZTilZDilZDilZDilZDilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZTilZDilZDilojilojilZcK4paI4paI4paI4paI4paI4paI4paI4pWR4paR4pWa4paI4paI4paI4paI4pWU4pWd4paR4paI4paI4paI4paI4paI4paI4pWU4pWd4paI4paI4paI4paI4paI4pWX4paR4paR4paI4paI4paI4paI4paI4paI4pWU4pWd4pWa4paI4paI4pWX4paR4paI4paI4pWU4pWd4paI4paI4pWR4pWa4paI4paI4paI4paI4paI4pWX4paR4paI4paI4pWR4paR4paR4paI4paI4pWR4paI4paI4paI4paI4paI4paI4pWU4pWdCuKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVkeKWkeKWkeKVmuKWiOKWiOKVlOKVneKWkeKWkeKWiOKWiOKVlOKVkOKVkOKVkOKVneKWkeKWiOKWiOKVlOKVkOKVkOKVneKWkeKWkeKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVl-KWkeKVmuKWiOKWiOKWiOKWiOKVlOKVneKWkeKWiOKWiOKVkeKWkeKVmuKVkOKVkOKVkOKWiOKWiOKVl-KWiOKWiOKVkeKWkeKWkeKWiOKWiOKVkeKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVlwrilojilojilZHilpHilpHilojilojilZHilpHilpHilpHilojilojilZHilpHilpHilpHilojilojilZHilpHilpHilpHilpHilpHilojilojilojilojilojilojilojilZfilojilojilZHilpHilpHilojilojilZHilpHilpHilZrilojilojilZTilZ3ilpHilpHilojilojilZHilojilojilojilojilojilojilZTilZ3ilZrilojilojilojilojilojilZTilZ3ilojilojilZHilpHilpHilojilojilZEK4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4paR4paR4pWa4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWd4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4pWa4pWQ4pWQ4pWQ4pWQ4pWQ4pWd4paR4paR4pWa4pWQ4pWQ4pWQ4pWQ4pWd4paR4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd')

console.log(Buffer.from(banner, 'base64').toString())
console.log('')
console.log(' Welcome to the Hypervisor for MacOS Images')
console.log(' Attention! THIS IS NOT A STABLE BUILD. USE IT FOR EXPERIMENTATION ONLY')
console.log('')
console.log(' Credits (without them this fork would not exist)')
console.log('  - https://github.com/kholia/OSX-KVM')
console.log('  - https://github.com/sickcodes/Docker-OSX')
console.log('')

const {createFolderIfNotExists, checkFileExists} = require("./node-src/boot");
const {workers} = require("./node-src/workers");

checkFileExists(process.cwd() + "/OVMF_VARS-1024x768.fd")
checkFileExists(process.cwd() + "/OVMF_CODE.fd")
checkFileExists(process.cwd() + "/.vnc-port")
checkFileExists(process.cwd() + "/hypervisor.json")

createFolderIfNotExists('.cache')
createFolderIfNotExists('.snapshots')
createFolderIfNotExists('disks')

workers()

const {Machine} = require("./node-src/machines");
const {vncDisplayArguments, MACHINE_HOST, nextVncPort} = require("./node-src/helpers/VncDisplay");
const express = require('express');
const app = express();
const pidusage = require('pidusage')
const DiskLink = require("./node-src/DiskLink");
const fs = require("node:fs");
const md5 = require("md5");
const QemuOpenCoreRunnable = require("./node-src/OpenCoreRunnable");
const {VirtualDrive} = require("./node-src/helpers/Drive");
const {createRandomMacOSHDD} = require("./node-src/utils/serialDisk");
const {logger} = require("./node-src/logger");
const {vms} = require("./node-src/vms");
const basicAuth = require('express-basic-auth')
const {PhantomFile} = require("./node-src/helpers/PhantomFile");
const path = require("node:path");
const audit = require('express-requests-logger')
const {ImgCreator} = require("./node-src/helpers/ImgCreator");
const _ = require("lodash");

const config = JSON.parse(String(fs.readFileSync(process.cwd() + "/hypervisor.json")))

app.use(express.json());
app.use(audit({
	logger
}))

app.use('/public', express.static(process.cwd() + '/node-src/public'))



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

app.set('views', process.cwd() + '/node-src/views');
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

	const snapshotFilePath = path.normalize(process.cwd() + '/.snapshots/' + md5(name) + '.json')
	const hddSrc = path.normalize(process.cwd() + `/disks/HDD-${md5(name)}.img`)
	const bootdiskSrc = path.normalize(process.cwd() + `/.cache/bootdisk-${md5(name)}.qcow2`)

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

	if (fs.existsSync(snapshotFilePath)) {
		return res.status(500).json({
			error: `virtual machine named '${name}' already exists and can only be launched via the run command`
		});
	}

	const port = parseInt(String(fs.readFileSync('.vnc-port')))

	fs.writeFileSync('.vnc-port', String(port + 1))

	const vncArgs = Object.freeze({
		host: MACHINE_HOST,
		port: (port + 1)
	})

	if (typeof vms[name] != "undefined") {
		return res.status(500).json({
			error: `A virtual machine named "${name}" has already been created and is running`
		})
	}

	let optionsOfUniqMacHDD = null

	if (!fs.existsSync(hddSrc)) {
		optionsOfUniqMacHDD = await createRandomMacOSHDD(bootdiskSrc)
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

	fs.accessSync(bootdiskSrc)
	fs.accessSync(hddSrc)

	// const openCoreHDD = new VirtualDrive(
	// 	Infinity,
	// 	'qcow2',
	// 	'OpenCoreBoot',
	// 	bootdiskSrc,
	// 	undefined,
	// 	'none',
	// 	true
	// )

	const opt = {
		onStdoutData: function (byte) {
			fs.appendFileSync(process.cwd() + `/.cache/stdout_${md5(name)}.log`, byte)
		},

		onStdinData: function (byte) {
			fs.appendFileSync(process.cwd() + `/.cache/stdin_${md5(name)}.log`, byte)
		},

		...vncDisplayArguments(vncArgs),
	}

	let proc

	switch (version) {
		case 'sonoma':
			proc = Machine.sonoma(opt, hddSrc)
			break;

		case 'ventura':
			proc = Machine.ventura(opt, hddSrc)
			break;

		default:
			throw "Unsupported OS version"
	}

	fs.writeFileSync(
		snapshotFilePath,
		JSON.stringify({
			creationDate: new Date(),

			snapshotFilePath,
			vncArgs,
			optionsOfUniqMacHDD,
			name,

			argv: proc.getArgs(),
		}, null, 2),
	)

	const runnable = proc.run()

	vms[name] = Object.freeze({
		proc,
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

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
	logger.info(`server is running and accessible at address tcp://${host}:${port}`)
});
