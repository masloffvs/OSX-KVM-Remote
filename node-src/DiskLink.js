const {VirtualDrive} = require("./helpers/Drive");
const path = require("node:path");

const openCoreBoot = new VirtualDrive(
	Infinity,
	'qcow2',
	'OpenCoreBoot',
	process.cwd() + '/OpenCore/OpenCore.qcow2',
	undefined,
	'none'
);

const installSonomaMedia = new VirtualDrive(
	Infinity,
	'raw',
	'InstallMedia',
	path.normalize(process.cwd() + '/prebuilt/basesystems/BaseSystem-Sonoma.img'),
	undefined,
	'none',
	false
);

const installVenturaMedia = new VirtualDrive(
	Infinity,
	'raw',
	'InstallMedia',
	path.normalize(process.cwd() + '/prebuilt/basesystems/BaseSystem-Ventura.img'),
	undefined,
	'none',
	false
);

module.exports = {
	installSonomaMedia,
	installVenturaMedia,

	openCoreBoot
}