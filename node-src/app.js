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
const {writeSnapshotFile, buildVirtualMachine, createVMImage, incrementVNCPort, getVNCArguments, checkIfVMExists, checkDiskSpace,
	getFreeDiskSpace, validateNameAndVersion
} = require("./SDK");

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

// Handle POST request to create a new virtual machine
app.post('/api/vms/create', async (req, res) => {
	try {
		const { name, version } = req.body;

		// Validate name and version
		validateNameAndVersion(name, version);

		// Check free disk space
		const freeInGB = getFreeDiskSpace();

		// Ensure free space is sufficient
		checkDiskSpace(freeInGB);

		// Check if the virtual machine already exists
		checkIfVMExists(name);

		// Increment VNC port
		const newVncPort = incrementVNCPort();

		// Set up VNC arguments
		const vncArgs = getVNCArguments(newVncPort);

		// Create virtual machine image
		const hddSrc = await createVMImage(name);

		// Launch VM based on the specified version
		const proc = await buildVirtualMachine(version, vncArgs, name, hddSrc);

		// Write snapshot file
		writeSnapshotFile(name, vncArgs, proc);

		// Send response with virtual machine name and VNC arguments
		res.status(201).json(
			{
				data: {
					vm: { name, vncArgs },
					host: {
						diskFreeSpace: freeInGB,
					}
				},
				isError: false,
			}
		);
	} catch (error) {
		res
			.status(500)
			.json({
				data: error.message,
				isError: true
			});
	}
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