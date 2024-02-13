const shell = require('shelljs');
const _ = require("lodash");

class UnixVirtualization {
	_tool = 'qemu-system-x86_64'

	constructor() {
		if (!shell.which(this._tool)) {
			console.log(`Sorry, this script requires "${this._tool}"`);
			process.exit(1);
		}
	}

	run(argv = []) {
		console.log(`${this._tool} ${_.flatten(argv).join(" ")}`)
		return shell.exec(`${this._tool} ${_.flatten(argv).join(" ")}`)
	}
}

module.exports = {UnixVirtualization}