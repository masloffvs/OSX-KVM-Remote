const path = require("node:path");
const {logger} = require("../logger");
const {exec} = require("node:child_process");
const shell = require("shelljs");

class AppleBootable {
	static _DEFAULT_PLIST = path.normalize(process.cwd() + '/osx-serial-generator/config-nopicker-custom.plist')

	static MASTER_PLISTS = {
		default: this._DEFAULT_PLIST,
		sonoma: this._DEFAULT_PLIST,
		ventura: this._DEFAULT_PLIST,
	}

	static _OPTIONS = {
		DEVICE_MODEL: 'NO_DATA',
		SERIAL: 'NO_SERIAL',
		BOARD_SERIAL: 'NO_DATA',
		UUID: 'NO_DATA',
		MAC_ADDRESS: 'NO_DATA',
		WIDTH: 1920,
		HEIGHT: 1080,
		KERNEL_ARGS: '',
		MASTER_PLIST: './config-nopicker-custom.plist',
		OUTPUT_QCOW: './OpenCore-nopicker.qcow2',
	}

	static generateRandomDeviceModel() {
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

	static generateUniqueDeviceModel(baseModel) {
		const randomNum = Math.floor(Math.random() * 10000);
		return `${baseModel}-${randomNum}`;
	}

	static generateUniqueSerial() {
		return [...Array(12)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
	}

	static generateUniqueBoardSerial() {
		return [...Array(17)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
	}

	static generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	static generateMacAddress() {
		const hexDigits = "0123456789ABCDEF";
		let macAddress = "";
		for (let i = 0; i < 6; i++) {
			macAddress += hexDigits.charAt(Math.floor(Math.random() * 16));
			macAddress += hexDigits.charAt(Math.floor(Math.random() * 16));
			if (i !== 5) macAddress += ":";
		}
		return macAddress;
	}

	static spawnData() {
		return Object.assign(this._OPTIONS, {
			DEVICE_MODEL: this.generateRandomDeviceModel(),
			SERIAL: this.generateUniqueSerial(),
			BOARD_SERIAL: this.generateUniqueBoardSerial(),
			UUID: this.generateUUID().toUpperCase(),
			MAC_ADDRESS: this.generateMacAddress(),
		})
	}

	static spawnDisk(
		options = undefined,
		size = '128G',
		actionSilently = false
	) {
		if (!shell.which("guestfish")) {
			logger.error(`Sorry, this script requires "guestfish"`, {
				namespace: 'AppleBootable'
			});

			process.exit(1);
		}

		const {
			DEVICE_MODEL,
			SERIAL,
			BOARD_SERIAL,
			UUID,
			MAC_ADDRESS,
			MASTER_PLIST,
			OUTPUT_QCOW = `./${SERIAL}.qcow2`,
		} = Object.assign(this.spawnData(), options)

		return new Promise((resolve, reject) => {
			logger.info(`💽 creating '${OUTPUT_QCOW}' disk... wait a bit`, {
				namespace: 'AppleBootable'
			});

			const createImageCommand = [
				`python3 main.py`,
				`--device_model "${DEVICE_MODEL}"`,
				`--serial "${SERIAL}"`,
				`--board_serial "${BOARD_SERIAL}"`,
				`--master_plist "${MASTER_PLIST}"`,
				`--uuid "${UUID}"`,
				`--size "${size}"`,
				`--mac_address "${MAC_ADDRESS}"`,
				`--bootpath "${OUTPUT_QCOW}"`
			].join(" ");

			logger.debug(`running '${createImageCommand}'`, {
				namespace: "AppleBootable"
			})

			const child = exec(
				createImageCommand.trim(),
				{ cwd: `${process.cwd()}/osx-serial-generator` },
				(error, stdout, stderr) => {
					if (error) {
						reject(error);
					}
				}
			);

			if (!actionSilently) {
				child.stdout.pipe(process.stdout);
				child.stdin.pipe(process.stdin);
				child.stderr.pipe(process.stderr);
			}

			child.on('error', function (error) {
				logger.error(`image '${OUTPUT_QCOW}' has error while creating`, {
					namespace: 'AppleBootable'
				});

				reject(error);
			});

			child.on('exit', function (code, signal) {
				if (code === 0) {
					logger.debug(`image '${OUTPUT_QCOW}' created successfully.`, {
						namespace: 'AppleBootable'
					});

					resolve();
				} else {
					logger.error(`image '${OUTPUT_QCOW}' has error while creating`, {
						namespace: 'AppleBootable'
					});

					reject(null);
				}
			});
		});
	}
}

module.exports = {AppleBootable}