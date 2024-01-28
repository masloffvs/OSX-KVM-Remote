const fs = require("node:fs");
const path = require("node:path");

class PhantomFile {
	constructor({path}) {
		this.path = path
	}

	generateFileID(length = 12) {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		let randomString = '';

		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length);
			randomString += characters.charAt(randomIndex);
		}

		return randomString;
	}

	createTempPersistentFile() {
		const tempPersistentFile = path.normalize(process.cwd() + `/.cache/${this.generateFileID()}.utyp`)

		fs.copyFileSync(this.path, tempPersistentFile)

		return tempPersistentFile
	}
}

module.exports = {PhantomFile}