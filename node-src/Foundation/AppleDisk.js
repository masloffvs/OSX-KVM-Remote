const {normalize} = require("node:path");
const {ImgCreator} = require("../helpers/ImgCreator");
const _ = require("lodash");
const {config} = require("../config");
const fs = require("node:fs");
const {logger} = require("../logger");
const {join, isAbsolute} = require("node:path");
const {Throwable} = require("../Throwable");
const util = require("node:util");
const {exec} = require("node:child_process");
const {R_OK, W_OK} = require("constants");
const {AppleVirtualDrive} = require("./AppleVirtualDrive");
const {createRandomMacOSHDD} = require("../utils/serialDisk");
const {VirtualDrive} = require("../helpers/Drive");

class AppleDisk {
	_src = ""
	_name = "NewAppleDisk"
	_type = "qcow2"
	_filetype = 'img'

	_size = _.get(
		config,
		"defaultMacStorageSize",
		'128G'
	)

	static BASEPATH = `${process.cwd()}/data/hdd/`

	static of(name, type = 'qcow2', filetype = 'img') {
		const appleDisk = new AppleDisk()

		appleDisk.create(name, type, filetype)

		return appleDisk
	}

	useExistDisk(path, name = undefined, type = 'qcow2', filetype = 'img') {
		this._name = name
		this._type = type
		this._filetype = filetype

		this._src = normalize(path)

		if (!isAbsolute(this._src)) {
			throw new Throwable("The path to the disk must be absolute", AppleDisk, {
				classdump: this
			})
		}

		return this
	}

	static isExistsDisk(name, filetype = 'img') {
		return fs.existsSync(
			normalize(join(AppleDisk.BASEPATH, `AppleDataDrive-${String(name).toLowerCase()}.${filetype}`))
		)
	}

	isExist() {
		return fs.existsSync(this._src)
	}

	static ofDvDIso(path, id) {
		return AppleVirtualDrive.of(
			path,
			id,
			undefined,
			"raw",
			id,
			{
				_if: 'none',
				_snapshot: 'off'
			}
		)
	}

	setSize(size = '128G') {
		this._size = size

		return this
	}

	create(name, type = 'qcow2', filetype = 'img') {
		this._name = name
		this._type = type
		this._filetype = filetype

		this._src = normalize(join(AppleDisk.BASEPATH, `AppleDataDrive-${String(name).toLowerCase()}.${this._filetype}`))

		if (!isAbsolute(this._src)) {
			throw new Throwable("The path to the disk must be absolute", AppleDisk, {
				classdump: this
			})
		}

		return this
	}

	async spawnImage(forceWrite= false, skipSpawningIfDiskExists = false) {
		if (skipSpawningIfDiskExists && fs.existsSync(this._src)) {
			return this
		}


		const execPromise = util.promisify(exec);
		const createImageCommand = `qemu-img create -f ${this._type} ${this._src} ${this._size}`;

		if (!forceWrite && fs.existsSync(this._src)) {
			throw new Throwable("AppleDisk cannot burn existing discs. To do this you need to use the force parameter in the function parameters", AppleDisk, {
				classdump: this
			})
		}

		logger.debug(`Spawning disk '${this._name.toLowerCase()}'...`);

		const { stdout, stderr } = await execPromise(createImageCommand);

		if (stdout) {
			logger.debug(stdout)
		}

		if (stderr) {
			logger.error(stderr)
		}

		if (!fs.existsSync(this._src)) {
			throw new Throwable("An error occurred while creating the hard disk", AppleDisk, {
				classdump: this
			})
		}

		fs.accessSync(this._src, R_OK | W_OK);

		logger.debug(`'${this._name.toLowerCase()}' spawned!`);

		return this
	}

	toVirtualDrive(ignoreSize = false, label = undefined) {
		return new AppleVirtualDrive({
			label,
			src: this._src,
			name: this._name,
			size: ignoreSize ? undefined : this._size,
			type: this._type
		})
	}

	dump() {
		return {
			name: this._name,
			src: normalize(this._src),
			type: this._type.toLowerCase(),
			filetype: this._filetype.toLowerCase(),
			size: this._size.toUpperCase(),
			meta: fs.statfsSync(this._src)
		}
	}

	static async createRandomMacOSHDD(path, masterPlist = MASTER_PLISTS.default) {
		const uniqueOptions = generateUniqueValues(options);
		const finalOptions = {
			...uniqueOptions,

			MASTER_PLIST: masterPlist,
			OUTPUT_QCOW: path
		}

		if (fs.existsSync(path)) {
			throw "the disk file already exists and cannot be specified as a virtual disk file"
		}

		const imgCreator = new SerialDisk(finalOptions);

		return {
			creator: await imgCreator.createImage(),
			options: finalOptions
		};
	}

	static async spawnBootableDiskWithUniqData(
		pathToDisk,
		materPlist
	) {
		let optionsOfUniqMacHDD = null

		if (!fs.existsSync(materPlist)) {
			throw new Throwable(
				`The plist file was not found at path "${pathToDisk}"`,
				AppleDisk,
				{
					pathToDisk,
					materPlist
				}
			)
		}

		if (fs.existsSync(pathToDisk)) {
			throw new Throwable(
				`The disk along the path "${pathToDisk}" already exists and cannot be overwritten to protect your data`,
				AppleDisk,
				{
					pathToDisk,
					materPlist
				}
			)
		}

		optionsOfUniqMacHDD = await createRandomMacOSHDD(pathToDisk, materPlist)

		fs.accessSync(pathToDisk, R_OK)

		const openCoreBoot = new VirtualDrive(
			Infinity,
			'qcow2',
			'OpenCoreBoot',
			pathToDisk,
			undefined,
			'none'
		);

		return {
			optionsOfUniqMacHDD,
			openCoreBoot,
			pathToDisk,
			materPlist
		}
	}
}


module.exports = {
	AppleDisk
}