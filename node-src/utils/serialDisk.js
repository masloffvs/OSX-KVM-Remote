const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');

const execPromise = util.promisify(exec);

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


class SerialDisk {
	constructor(options) {
		this.options = options;
	}

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
				MASTER_PLIST_URL = 'https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/config-nopicker-custom.plist',
				MASTER_PLIST,
				OUTPUT_QCOW = `./${SERIAL}.OpenCore-nopicker.qcow2`,
			} = this.options;

			const EFI_FOLDER = './OpenCore/EFI';
			const RESOURCES_FOLDER = './resources/OcBinaryData/Resources';

			// Function to download EFI folder and resources
			const downloadEFIAndResources = async () => {
				if (!fs.existsSync(EFI_FOLDER)) {
					// Download EFI folder and resources here...
					throw "EFI Fail"
				}
			};

			// Function to generate the bootdisk
			const generateBootdisk = async () => {
				// Generate the bootdisk here...
				const createImageCommand = `qemu-img create -f qcow2 ${OUTPUT_QCOW} ${size}`;

				try {
					await execPromise(createImageCommand);
					console.log(`💽 Image ${OUTPUT_QCOW} created successfully.`);
				} catch (error) {
					console.error(`💽 Error creating the image: ${error}`);
				}
			};

			await downloadEFIAndResources();
			await generateBootdisk();
		} catch (error) {
			console.error(`💽 Error creating the image: ${error}`);
		}
	}
}

const options = {
	DEVICE_MODEL: 'iMacPro1,1',
	SERIAL: 'C02TW0WAHX87',
	BOARD_SERIAL: 'C027251024NJG36UE',
	UUID: '5CCB366D-9118-4C61-A00A-E5BAF3BED451',
	MAC_ADDRESS: 'A8:5C:2C:9A:46:2F',
	WIDTH: 1920,
	HEIGHT: 1080,
	KERNEL_ARGS: '',
	MASTER_PLIST_URL: 'https://raw.githubusercontent.com/sickcodes/osx-serial-generator/master/config-nopicker-custom.plist',
	MASTER_PLIST: '',
	OUTPUT_QCOW: './OpenCore-nopicker.qcow2',
};

module.exports = {
	async createRandomMacOSHDD(path) {
		const uniqueOptions = generateUniqueValues(options);

		const imgCreator = new SerialDisk({...uniqueOptions, OUTPUT_QCOW: path});
		return await imgCreator.createImage();
	}
}
