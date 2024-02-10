const {Drive} = require("./DriveDefault");

class SSD extends Drive {
	constructor(size, format, label) {
		super(size, format, label);
	}

	getQemuDriveConfig() {
		return `-drive file=${this.label},media=disk,format=${this.format},cache=writeback,size=${this.size}G`;
	}
}

module.exports = {SSD}