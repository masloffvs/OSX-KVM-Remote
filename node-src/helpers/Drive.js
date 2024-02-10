const {VirtualDrive} = require("./VirtualDrive");
const {Drive} = require("./DriveDefault");
const {HDD} = require("./HDD");
const {SSD} = require("./SSD");
const path = require("node:path");

// const openCoreBoot = new VirtualDrive(
// 	Infinity,
// 	'qcow2',
// 	'OpenCoreBoot',
// 	process.cwd() + '/OpenCore/OpenCore.qcow2',
// 	undefined,
// 	'none'
// );

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


/**
 * Create a QEMU driver device configuration string in the specified format.
 * @param {string} device - The device type (e.g., 'ide-hd', 'isa-applesmc').
 * @param {Object} options - Additional options for the device configuration.
 * @returns {string} QEMU driver device configuration string.
 */
function driverDevice(device, options = {}) {
	const optionStrings = Object.entries(options)
		.map(([key, value]) => (value ? `${key}="${value}"` : key))
		.join(',');

	return `-device ${device}${optionStrings ? `,${optionStrings}` : ''}`;
}

module.exports = {
	Drive,
	HDD,
	SSD,
	VirtualDrive,
	driverDevice,

	MediaSonoma: installSonomaMedia,
	MediaVentura: installVenturaMedia,
}