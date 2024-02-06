const fs = require("node:fs");
const path_ = require("node:path");
const crypto = require('node:crypto');
const {parseQemuDiskInfo} = require("./QemuDiskInfo");
const md5 = require('md5');
const {logger} = require("../logger");
const {Throwable} = require("../Throwable");

function generateHardDiskID(length = 12) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let randomString = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		randomString += characters.charAt(randomIndex);
	}

	return randomString;
}

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

async function toVirtualDrive(path, if_='none', isSnapshot=false) {
	const info = await parseQemuDiskInfo(path)

	return new VirtualDrive(
		Infinity,
		info.fileFormat,
		undefined,
		info.image || path,
		undefined,
		if_,
		isSnapshot
	)
}

class Drive {
	constructor(size, format, label) {
		this.size = size;
		this.format = format; // qcow2, raw
		this.label = label;
	}

	getDetails() {
		return `Drive: ${this.label}, Size: ${this.size}GB, Format: ${this.format}`;
	}

	getQemuDriveConfig() {
		return `-drive file=${this.label},format=${this.format},size=${this.size}G`;
	}
}

class HDD extends Drive {
	constructor(size, format, label) {
		super(size, format, label);
	}

	getQemuDriveConfig() {
		return `-drive file=${this.label},media=disk,format=${this.format},size=${this.size}G`;
	}
}

class SSD extends Drive {
	constructor(size, format, label) {
		super(size, format, label);
	}

	getQemuDriveConfig() {
		return `-drive file=${this.label},media=disk,format=${this.format},cache=writeback,size=${this.size}G`;
	}
}

/**
 * Represents a virtual drive used in a virtual machine configuration.
 * @extends Drive
 */
class VirtualDrive extends Drive {
	/**
	 * Create a new instance of the VirtualDrive class.
	 * @param {number} size - The size of the virtual drive in bytes.
	 * @param {string} format - The format of the virtual drive (e.g., 'qcow2', 'raw').
	 * @param {string} label - The label or name for the virtual drive.
	 * @param {string} path - The path to the physical file representing the virtual drive.
	 * @param {string} [id=undefined] - The unique identifier for the virtual drive.
	 * @param {string} [if_='none'] - The interface type for the virtual drive (e.g., 'ide', 'scsi', 'virtio', 'none').
	 * @param {boolean} [snapshot=true] - The snapshot mode for the virtual drive (bool).
	 * @param bootindex
	 * @param serial
	 */
	constructor(
		size,
		format,
		label,
		path,
		id = undefined,
		if_ = 'none',
		snapshot = true,
		bootindex = null,
		serial = generateHardDiskID(20)
	) {
		super(size, format, label);

		logger.info(`init VirtualDrive "${label || id || path}"`)

		if (typeof path != 'string') {
			logger.error(`init VirtualDrive "${label || id || path}"`)
			throw new Throwable(
				"Only the string can be specified as the path to the virtual disk file",
				VirtualDrive
			)
		}

		if (path_.isAbsolute(path)) {
			this.path = path;
		} else {
			this.path = path_.normalize(process.cwd() + '/' + path);
		}

		if (!fs.existsSync(this.path)) {
			logger.error(`virtual disk at path '${this.path}' not found`)
			throw new Throwable(
				"The virtual disk was not created because the virtual disk file was not found at the specified path",
				VirtualDrive,
				{classdump: this}
			)
		}

		fs.accessSync(this.path); // Ensure the file at 'path' exists

		this.if_ = if_;
		this.id = id || label || generateHardDiskID();
		this.snapshot = snapshot ? 'on' : 'off';
		this.bootindex = bootindex;
		this.serial = serial;

		if (!['ide', 'scsi', 'virtio', 'none'].includes(if_)) {
			throw "exit"
		}

		if (!['qcow2', 'raw'].includes(format)) {
			throw "exit"
		}
	}

	createGhostDrive() {
		const newPath = path_.normalize(process.cwd() + '/.cache/' + md5(this.path + (new Date()).getTime()))

		fs.copyFileSync(
			(this.path),
			newPath
		)

		this.path = newPath

		return this
	}

	/**
	 * Get details about the virtual drive.
	 * @returns {string} Details of the virtual drive, including size, format, label, and path.
	 */
	getDetails() {
		return `${super.getDetails()}, Path: ${this.path}`;
	}

	/**
	 * Get the QEMU drive configuration string for the virtual drive.
	 * @returns {string} QEMU drive configuration string.
	 */
	getQemuDriveConfig() {
		return `-drive id='${this.id || 'ra'}',format=${this.format},if=${this.if_},snapshot=${this.snapshot},file=${this.path}${this.bootindex ? `,bootindex=${this.bootindex},serial=${this.serial}` : ''}`;
	}
}


module.exports = {
	Drive,
	HDD,
	SSD,
	VirtualDrive,
	driverDevice,
	toVirtualDrive
}