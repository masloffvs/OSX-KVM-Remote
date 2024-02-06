const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const {logger} = require("../logger");
const path = require('node:path')

const execPromise = util.promisify(exec);

const MASTER_PLISTS = {
	sonoma: path.normalize(process.cwd() + '/osx-serial-generator/config-nopicker-custom.plist'),
	ventura: path.normalize(process.cwd() + '/osx-serial-generator/config-nopicker-legacy.plist')
}

function generateRandomDeviceModel() {
	const deviceModels = [
		'iMacPro1,1',
		'MacBookAir5,2',
		'MacBookPro9,1',
		'MacBook8,1',
		'MacBookAir4,1',
		'iMac19,1',
		'MacBookPro16,1',
		'MacBookAir6,2',
		'MacBook9,1',
		'MacBookPro13,3',
		'iMac12,1',
		'MacBookPro14,3',
		'MacBookPro8,3',
		'MacBookAir7,2',
		'iMac16,1',
		'MacBookPro15,2',
		'MacBookPro10,1',
		'MacBookAir8,1',
		'iMac14,2',
		'MacBookPro11,2',
		'MacBookPro13,1',
		'iMac18,3',
		'MacBookAir3,1',
		'MacBookPro6,2',
		'iMac17,1',
		'MacBookPro12,1',
		'MacBookAir9,1',
		'MacBookPro15,1',
		'iMac13,1',
		'MacBookPro14,1',
	];

	const randomIndex = Math.floor(Math.random() * deviceModels.length);
	return deviceModels[randomIndex];
}


function generateUniqueValues(baseObject) {
	return {
		...baseObject,
		DEVICE_MODEL: generateRandomDeviceModel(),
		SERIAL: generateUniqueSerial(),
		BOARD_SERIAL: generateUniqueBoardSerial(),
		UUID: generateUUID().toUpperCase(),
		MAC_ADDRESS: generateMacAddress(),
	};
}

function generateUniqueDeviceModel(baseModel) {
	const randomNum = Math.floor(Math.random() * 10000);
	return `${baseModel}-${randomNum}`;
}

function generateUniqueSerial() {
	return [...Array(12)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
}

function generateUniqueBoardSerial() {
	return [...Array(17)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
}

function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function generateMacAddress() {
	const hexDigits = "0123456789ABCDEF";
	let macAddress = "";
	for (let i = 0; i < 6; i++) {
		macAddress += hexDigits.charAt(Math.floor(Math.random() * 16));
		macAddress += hexDigits.charAt(Math.floor(Math.random() * 16));
		if (i !== 5) macAddress += ":";
	}
	return macAddress;
}


/**
 * Represents a class for creating a serial disk image.
 */
class SerialDisk {
	/**
	 * Create a new instance of the SerialDisk class.
	 * @param {Object} options - The options for configuring the serial disk creation.
	 * @param {string} options.DEVICE_MODEL - The device model.
	 * @param {string} options.SERIAL - The serial number.
	 * @param {string} options.BOARD_SERIAL - The board serial number.
	 * @param {string} options.UUID - The UUID.
	 * @param {string} options.MAC_ADDRESS - The MAC address.
	 * @param {number} [options.WIDTH=1920] - The width of the image.
	 * @param {number} [options.HEIGHT=1080] - The height of the image.
	 * @param {string} [options.KERNEL_ARGS=''] - Additional kernel arguments.
	 * @param {string} [options.MASTER_PLIST_URL='https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/config-nopicker-custom.plist'] - The URL to the master plist file.
	 * @param {string} options.MASTER_PLIST - The master plist.
	 * @param {string} [options.OUTPUT_QCOW='./{SERIAL}.OpenCore-nopicker.qcow2'] - The output QCOW image path.
	 */
	constructor(options) {
		this.options = options;
	}

	/**
	 * Create a serial disk image with the specified size.
	 * @param {string} [size='256G'] - The size of the serial disk image.
	 * @returns {Promise<void>} - A promise that resolves when the image is created successfully.
	 */
	async createImage(size = '256G') {
		try {
			const {
				DEVICE_MODEL,
				SERIAL,
				BOARD_SERIAL,
				UUID,
				MAC_ADDRESS,
				WIDTH = 1920,
				HEIGHT = 1080,
				KERNEL_ARGS = '',
				MASTER_PLIST,
				OUTPUT_QCOW = `./${SERIAL}.OpenCore-nopicker.qcow2`,
			} = this.options;

			// Function to generate the bootdisk
			const generateBootdisk = () => {
				return new Promise((resolve, reject) => {
					logger.info(`💽 creating '${OUTPUT_QCOW}' disk... wait a bit`);

					const createImageCommand = `python3 main.py \
            --device_model "${DEVICE_MODEL}" \
            --serial "${SERIAL}" \
            --board_serial "${BOARD_SERIAL}" \
            --uuid "${UUID}" \
            --size "${size}" \
            --master_plist "${MASTER_PLIST}" \
            --mac_address "${MAC_ADDRESS}" \
            --bootpath "${OUTPUT_QCOW}"`;

					logger.info(createImageCommand)

					try {
						const child = exec(
							createImageCommand.trim(),
							{ cwd: `${process.cwd()}/osx-serial-generator` },
							(error, stdout, stderr) => {
								if (error) {
									reject(error);
								}
							}
						);

						child.stdout.pipe(process.stdout);
						child.stdin.pipe(process.stdin);

						child.on('error', function (error) {
							reject(error);
						});

						child.on('exit', function (code, signal) {
							if (code === 0) {
								logger.info(`💽 image ${OUTPUT_QCOW} created successfully.`);
								resolve();
							} else {
								console.error({ code, signal });
								reject(null);
							}
						});
					} catch (error) {
						reject(error);
						logger.error(`💽 Error creating the image: ${error}`);
					}
				});
			};

			await generateBootdisk();
		} catch (error) {
			console.error(`💽 Error creating the image: ${error}`);
		}
	}
}

const options = {
	DEVICE_MODEL: 'NO_DATA',
	SERIAL: 'NO_SERIAL',
	BOARD_SERIAL: 'NO_DATA',
	UUID: 'NO_DATA',
	MAC_ADDRESS: 'NO_DATA',
	WIDTH: 1920,
	HEIGHT: 1080,
	KERNEL_ARGS: '',
	MASTER_PLIST: '',
	OUTPUT_QCOW: './OpenCore-nopicker.qcow2',
};

module.exports = {
	MASTER_PLISTS,

	async createRandomMacOSHDD(path, masterPlist = MASTER_PLISTS.sonoma) {
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
}
