const {Machine} = require("./node-src/machines");
const {vncDisplayArguments, MACHINE_HOST, nextVncPort} = require("./node-src/helpers/VncDisplay");
const {createFolderIfNotExists} = require("./node-src/boot");
const express = require('express');
const app = express();
const pidusage = require('pidusage')
const DiskLink = require("./node-src/DiskLink");
const fs = require("node:fs");
const md5 = require("md5");
const QemuOpenCoreRunnable = require("./node-src/OpenCoreRunnable");
const {ImgCreator} = require("./node-src/helpers/ImgCreator");
const {VirtualDrive} = require("./node-src/helpers/Drive");
const {createRandomMacOSHDD} = require("./node-src/utils/serialDisk");

const vms = {}

app.use(express.json());
app.use('/public', express.static(process.cwd() + '/node-src/public'))

app.set('views', process.cwd() + '/node-src/views');
app.set('view engine', 'jsx');
app.engine('jsx', require('express-react-views').createEngine());

createFolderIfNotExists('.cache')
createFolderIfNotExists('.snapshots')
createFolderIfNotExists('disks')

app.get('/', function(req, res){
	res.render('index', {
		vms: Object.entries(vms).map(pair => ({
			name: pair[0],
			vm: pair[1],
		}))
	});
});

app.post('/api/vms/basic-remote', async (req, res) => {
	const { name } = req.body;

	if (!fs.existsSync('.vnc-port')) {
		fs.writeFileSync('.vnc-port', "1")
	}

	const port = parseInt(fs.readFileSync('.vnc-port'))
	const hddSrc = process.cwd() + `/disks/HDD-${md5(name)}.img`

	fs.writeFileSync('.vnc-port', String(port + 1))

	const vncArgs = {
		host: MACHINE_HOST,
		port: (port + 1)
	}

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
				false,
				1
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

	vms[name] = {
		proc,
		runnable
	}

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

	const proc = new QemuOpenCoreRunnable()

	proc.setArgs(require(path))

	const runnable = proc.run()

	vms[name] = {
		proc,
		runnable
	}

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

// Остановка виртуальной машины
app.post('/api/vms/:name/stop', (req, res) => {

});

// Запуск HTTP-сервера
const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Сервер запущен на порту ${port}`);
});
