const fs = require('node:fs');
const util = require('node:util');
const { exec } = require('child_process');
const {logger} = require("../logger");

const execPromise = util.promisify(exec);

class ImgCreator {
	constructor(filename, size) {
		this.filename = filename;
		this.size = size;
	}

	async createImage() {
		logger.log(`💾 HDD ${this.filename} creating`);

		const createImageCommand = `qemu-img create -f qcow2 ${this.filename} ${this.size}`;

		try {
			const { stdout, stderr } = await execPromise(createImageCommand);
			logger.log(`💾 HDD ${this.filename} created`);
		} catch (error) {
			logger.error(`💾 not created: ${error}`);
		}
	}
}

module.exports = {ImgCreator}