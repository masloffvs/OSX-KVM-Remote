const {Drive} = require("./DriveDefault");

/**
 * @deprecated
 */
class HDD extends Drive {
	constructor(size, format, label) {
		super(size, format, label);
	}

	getQemuDriveConfig() {
		return `-drive file=${this.label},media=disk,format=${this.format},size=${this.size}G`;
	}
}

module.exports = {HDD}