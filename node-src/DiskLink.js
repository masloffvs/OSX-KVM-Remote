const {VirtualDrive} = require("./helpers/Drive");

const openCoreBoot = new VirtualDrive(
	Infinity,
	'qcow2',
	'OpenCoreBoot',
	process.cwd() + '/OpenCore/OpenCore.qcow2',
	undefined,
	'none'
);

const installMedia = new VirtualDrive(
	Infinity,
	'raw',
	'InstallMedia',
	process.cwd() + '/prebuilt/basesystems/BaseSystem-Sonoma.img',
	undefined,
	'none',
	false
);

module.exports = {
	installMedia,
	openCoreBoot
}