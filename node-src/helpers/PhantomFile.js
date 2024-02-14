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

	/**
	 * @deprecated
	 * @return {string}
	 */
	createTempPersistentFile() {
		const tempPersistentFile = path.normalize(process.cwd() + `/.cache/${this.generateFileID()}.utyp`)

		fs.copyFileSync(this.path, tempPersistentFile)

		return tempPersistentFile
	}

	createPhantomFile(name = null) {
		if (!fs.existsSync(`${process.cwd()}/phantoms/`)) {
			fs.mkdirSync(`${process.cwd()}/phantoms/`)
		}

		if (name) {
			const tempPersistentFile = path.normalize(process.cwd() + `/phantoms/${name || this.generateFileID()}.phantom`)

			if (!fs.existsSync(tempPersistentFile)) {
				fs.copyFileSync(this.path, tempPersistentFile)
			}

			return tempPersistentFile
		} else {
			const tempPersistentFile = path.normalize(process.cwd() + `/phantoms/${name || this.generateFileID()}.phantom`)

			fs.copyFileSync(this.path, tempPersistentFile)

			return tempPersistentFile
		}

	}
}

module.exports = {PhantomFile}