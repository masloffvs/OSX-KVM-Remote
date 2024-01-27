const fs = require('node:fs')

module.exports = {
	createFolderIfNotExists(src) {
		if (!fs.existsSync((process.cwd() + "/" + src))) {
			fs.mkdirSync(
				(process.cwd() + "/" + src),
				{
					recursive: true
				}
			)
		}
	}
}