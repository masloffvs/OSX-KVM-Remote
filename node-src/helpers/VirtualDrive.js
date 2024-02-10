const {Drive} = require("./DriveDefault");
const fs = require("node:fs");
const path_ = require("node:path");
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
				VirtualDrive,
				{
					classdump: this
				}
			)
		}

		if (path_.isAbsolute(path)) {
			this.path = path;
		} else {
			this.path = path_.normalize(process.cwd() + '/' + path);
		}

		logger.error(`final path to '${label || id || path}' disk is '${this.path}'`)


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
			throw new Throwable(
				"Invalid virtual drive interface specified. Supported interfaces are: ide, scsi, virtio, none.",
				VirtualDrive,
				{ classdump: this }
			)
		}

		if (!['qcow2', 'raw'].includes(format)) {
			throw new Throwable(
				"Invalid virtual drive format specified. Supported formats are: qcow2, raw.",
				VirtualDrive,
				{ classdump: this }
			)
		}
	}

	createGhostDrive() {
		const newPath = path_.normalize(process.cwd() + '/data/hdd/ghost_' + (label || id))

		// Check if the file already exists
		if (fs.existsSync(newPath)) {
			throw new Throwable(
				"A file already exists at the specified path for the ghost drive.",
				VirtualDrive,
				{ classdump: this }
			);
		}

		// Copy the file synchronously
		fs.copyFileSync(
			this.path,
			newPath
		)

		// Update the path
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

module.exports = {VirtualDrive}
