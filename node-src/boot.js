const fs = require('node:fs')
const {logger} = require("./logger");

module.exports = {
	createFolderIfNotExists(src) {
		const folder = (process.cwd() + "/" + src)

		if (!fs.existsSync(folder)) {
			logger.debug(`folder '${folder}' was created because it was not found`)
			fs.mkdirSync(
				(process.cwd() + "/" + src),
				{
					recursive: true
				}
			)
 	 	} else {
			logger.debug(`folder '${folder}' passed`)
		}
	}
}