
/**
 * @deprecated
 */
class Drive {
	constructor(size, format, label) {
		this.size = size;
		this.format = format; // qcow2, raw
		this.label = label;
	}

	getDetails() {
		return `Drive: ${this.label}, Size: ${this.size}GB, Format: ${this.format}`;
	}

	getQemuDriveConfig() {
		return `-drive file=${this.label},format=${this.format},size=${this.size}G`;
	}
}


module.exports = {Drive}