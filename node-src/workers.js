const fs = require("node:fs");
const {logger} = require("./logger");
module.exports = {
	workers: function () {
		fs.watch(process.cwd() + '/disks/', {recursive: true}, function (type, file) {
			logger.debug(type, file)
		})
	}
}