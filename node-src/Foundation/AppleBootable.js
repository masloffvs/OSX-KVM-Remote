const path = require("node:path");
const {logger} = require("../logger");
const {exec} = require("node:child_process");

class AppleBootable {
	_DEFAULT_PLIST = path.normalize(process.cwd() + '/osx-serial-generator/config-nopicker-custom.plist')

	MASTER_PLISTS = {
		default: this._DEFAULT_PLIST,
		sonoma: this._DEFAULT_PLIST,
		ventura: this._DEFAULT_PLIST,
	}

	generateRandomDeviceModel() {
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

	generateUniqueValues(baseObject) {
		return {
			...baseObject,
			DEVICE_MODEL: generateRandomDeviceModel(),
			SERIAL: generateUniqueSerial(),
			BOARD_SERIAL: generateUniqueBoardSerial(),
			UUID: generateUUID().toUpperCase(),
			MAC_ADDRESS: generateMacAddress(),
		};
	}

	generateUniqueDeviceModel(baseModel) {
		const randomNum = Math.floor(Math.random() * 10000);
		return `${baseModel}-${randomNum}`;
	}

	generateUniqueSerial() {
		return [...Array(12)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
	}

	generateUniqueBoardSerial() {
		return [...Array(17)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
	}

	generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	generateMacAddress() {
		const hexDigits = "0123456789ABCDEF";
		let macAddress = "";
		for (let i = 0; i < 6; i++) {
			macAddress += hexDigits.charAt(Math.floor(Math.random() * 16));
			macAddress += hexDigits.charAt(Math.floor(Math.random() * 16));
			if (i !== 5) macAddress += ":";
		}
		return macAddress;
	}

	spawn(options, size = '128G') {
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
		} = options;

		return new Promise((resolve, reject) => {
			logger.info(`💽 creating '${OUTPUT_QCOW}' disk... wait a bit`);

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

			logger.debug(`${createImageCommand}`, {
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
		});
	}
}

module.exports = {AppleBootable}