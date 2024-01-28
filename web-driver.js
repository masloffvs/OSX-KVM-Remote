const banner = ('CuKWiOKWiOKVl-KWkeKWkeKWiOKWiOKVl-KWiOKWiOKVl-KWkeKWkeKWkeKWiOKWiOKVl-KWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKVl-KWkeKWkeKWkeKWiOKWiOKVl-KWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkQrilojilojilZHilpHilpHilojilojilZHilZrilojilojilZfilpHilojilojilZTilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZTilZDilZDilZDilZDilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZHilpHilpHilpHilojilojilZHilojilojilZHilojilojilZTilZDilZDilZDilZDilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZTilZDilZDilojilojilZcK4paI4paI4paI4paI4paI4paI4paI4pWR4paR4pWa4paI4paI4paI4paI4pWU4pWd4paR4paI4paI4paI4paI4paI4paI4pWU4pWd4paI4paI4paI4paI4paI4pWX4paR4paR4paI4paI4paI4paI4paI4paI4pWU4pWd4pWa4paI4paI4pWX4paR4paI4paI4pWU4pWd4paI4paI4pWR4pWa4paI4paI4paI4paI4paI4pWX4paR4paI4paI4pWR4paR4paR4paI4paI4pWR4paI4paI4paI4paI4paI4paI4pWU4pWdCuKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVkeKWkeKWkeKVmuKWiOKWiOKVlOKVneKWkeKWkeKWiOKWiOKVlOKVkOKVkOKVkOKVneKWkeKWiOKWiOKVlOKVkOKVkOKVneKWkeKWkeKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVl-KWkeKVmuKWiOKWiOKWiOKWiOKVlOKVneKWkeKWiOKWiOKVkeKWkeKVmuKVkOKVkOKVkOKWiOKWiOKVl-KWiOKWiOKVkeKWkeKWkeKWiOKWiOKVkeKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVlwrilojilojilZHilpHilpHilojilojilZHilpHilpHilpHilojilojilZHilpHilpHilpHilojilojilZHilpHilpHilpHilpHilpHilojilojilojilojilojilojilojilZfilojilojilZHilpHilpHilojilojilZHilpHilpHilZrilojilojilZTilZ3ilpHilpHilojilojilZHilojilojilojilojilojilojilZTilZ3ilZrilojilojilojilojilojilZTilZ3ilojilojilZHilpHilpHilojilojilZEK4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4paR4paR4pWa4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWd4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4pWa4pWQ4pWQ4pWQ4pWQ4pWQ4pWd4paR4paR4pWa4pWQ4pWQ4pWQ4pWQ4pWd4paR4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd')

console.log(Buffer.from(banner, 'base64').toString())
console.log('')

const {createFolderIfNotExists} = require("./node-src/boot");
const {workers} = require("./node-src/workers");

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

app.use(express.json());
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

app.get('/api/vms', function(req, res){
	res.json(
		Object.entries(vms).map(pair => ({
			name: pair[0],
			vm: pair[1],
		}))
	)
});

app.get('/api/disks', async (req, res) => {
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

app.post('/api/vms', async (req, res) => {
	const { name } = req.body;

	const snapshotFilePath = process.cwd() + '/.snapshots/' + md5(name) + '.json'
	const hddSrc = process.cwd() + `/disks/HDD-${md5(name)}.img`

	if (fs.existsSync(snapshotFilePath)) {
		return res.status(500).json({
			message: `virtual machine named '${name}' already exists and can only be launched via the run command`
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

	if (!fs.existsSync(hddSrc)) {
		await createRandomMacOSHDD(hddSrc)
	}

	fs.accessSync(hddSrc)

	const proc = Machine.sonoma({
		storageDevices: [
			DiskLink
				.openCoreBoot
				.createGhostDrive(),

			DiskLink
				.installMedia
				.createGhostDrive(),

			new VirtualDrive(
				Infinity,
				'qcow2',
				'MacHDD',
				hddSrc,
				undefined,
				'none',
				false
			)
		],

		onStdoutData: function (byte) {
			fs.appendFileSync(process.cwd() + `/.cache/stdout_${md5(name)}.log`, byte)
		},

		onStdinData: function (byte) {
			fs.appendFileSync(process.cwd() + `/.cache/stdin_${md5(name)}.log`, byte)
		},

		...vncDisplayArguments(vncArgs),

		otherArgs: [
			'-drive if=pflash,format=raw,readonly,file="./OVMF_CODE.fd"',
			'-drive if=pflash,format=raw,file="./OVMF_VARS-1024x768.fd"',
			'-device ide-hd,bus=sata.4,drive=MacHDD',
			'-smbios type=2'
		]
	})

	fs.writeFileSync(
		process.cwd() + "/.snapshots/" + md5(name) + ".json",
		JSON.stringify(proc.getArgs(), null, 2),
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
	const path = process.cwd() + '/.snapshots/' + md5(name) + '.json'

	if (typeof vms[name] != "undefined") {
		return res.status(500).json({
			message: 'such a VM already exists and is running'
		});
	}

	if (!fs.existsSync(path)) {
		return res.status(404).json({
			message: `vm "${name}" not found`
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

	proc.setArgs(require(path))

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

app.post('/api/vms/:name/stop', (req, res) => {

});

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
	logger.info(`server is running and accessible at address tcp://${host}:${port}`)
});
