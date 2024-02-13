const {Machine} = require("./machines");
const {vncDisplayArguments, MACHINE_HOST} = require("./helpers/VncDisplay");
const {appendFileSync, readFileSync, existsSync, writeFileSync} = require("node:fs");
const {normalize} = require("node:path");
const md5 = require("md5");
const {config} = require("./config");
const _ = require("lodash");
const {ImgCreator} = require("./helpers/ImgCreator");
const disk = require("diskusage");
const fs = require("node:fs");

function validateNameAndVersion(name, version) {
	if (!['ventura', 'sonoma'].includes(version)) {
		throw new Error(`Unsupported OS version: ${version}`);
	}

	if (!/^[a-zA-Z]+$/.test(name)) {
		throw new Error(`Invalid virtual machine name: ${name}`);
	}
}

function getFreeDiskSpace() {
	const info = disk.checkSync(process.cwd());
	return info.free / 1024 / 1024 / 1024;
}

function checkDiskSpace(freeInGB) {
	const minFreeSpaceGB = _.get(config, 'reservedSize.min', 30);
	if (freeInGB < minFreeSpaceGB) {
		throw new Error(`Insufficient free space: ${freeInGB}GB available, ${minFreeSpaceGB}GB required`);
	}
}

function checkIfVMExists(name) {
	const snapshotFilePath = normalize(process.cwd() + '/.snapshots/' + md5(name) + '.json');
	if (existsSync(snapshotFilePath)) {
		throw new Error(`Virtual machine '${name}' already exists`);
	}
}

function incrementVNCPort() {
	const port = parseInt(String(readFileSync('.vnc-port')));
	const newVncPort = String(port + _.get(config, 'vncEveryNewInstanceStep', 1));
	writeFileSync('.vnc-port', newVncPort);
	return newVncPort;
}

function getVNCArguments(port) {
	return Object.freeze({
		host: MACHINE_HOST,
		port
	});
}

async function createVMImage(name) {
	const hddSrc = normalize(process.cwd() + `/data/hdd/DATA_${name}.img`);
	const imageCreator = new ImgCreator(
		hddSrc,
		_.get(config, 'defaultMacStorageSize', '256G')
	);

	await imageCreator.createImage();

	fs.accessSync(hddSrc);

	return hddSrc
}

async function buildVirtualMachine(version, vncArgs, name, hddSrc) {
	const bootdiskSrc = normalize(process.cwd() + `/data/bootable/BOOT_${name}.qcow2`);
	const opt = {
		onStdoutData: byte => appendFileSync(process.cwd() + `/.tty/stdout_${md5(name)}.log`, byte),
		onStdinData: byte => appendFileSync(process.cwd() + `/.tty/stdin_${md5(name)}.log`, byte),
		...vncDisplayArguments(vncArgs)
	};

	switch (version) {
		case 'sonoma':
			return await Machine.sonoma(opt, hddSrc, bootdiskSrc);
		case 'ventura':
			return await Machine.ventura(opt, hddSrc, bootdiskSrc);
		default:
			throw new Error("Unsupported OS version");
	}
}

function writeSnapshotFile(name, vncArgs, proc) {
	const snapshotFilePath = normalize(process.cwd() + '/.snapshots/' + md5(name) + '.json');

	writeFileSync(snapshotFilePath, JSON.stringify({
		creationDate: new Date(),
		snapshotFilePath,
		vncArgs,
		name,
		argv: proc.qemu.getArgs()
	}, null, 2));
}

module.exports = {
	validateNameAndVersion,
	writeSnapshotFile,
	buildVirtualMachine,
	getVNCArguments,
	createVMImage,
	incrementVNCPort,
	checkDiskSpace,
	checkIfVMExists,
	getFreeDiskSpace
}