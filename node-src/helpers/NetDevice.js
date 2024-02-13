function generateQemuMacAddress() {
	const hexDigits = '0123456789ABCDEF';
	let macAddress = '52:54:00';
	for (let i = 0; i < 3; i++) {
		macAddress += ':' + hexDigits.charAt(Math.floor(Math.random() * 16)) + hexDigits.charAt(Math.floor(Math.random() * 16));
	}
	return macAddress;
}

class NetDevice {
	constructor(id, hostfwdPort, guestPort, macAddress = generateQemuMacAddress()) {
		this.id = id;
		this.hostfwdPort = hostfwdPort;
		this.guestPort = guestPort;
		this.macAddress = macAddress;
	}

	getNetdevConfig() {
		if (this.hostfwdPort && this.guestPort) {
			return [`-netdev`, `user,id=${this.id},hostfwd=tcp::${this.hostfwdPort}-:${this.guestPort}`];
		} else {
			return ['-netdev', `user,id=${this.id}`];
		}
	}

	getDeviceConfig() {
		return ['-device', `vmxnet3,netdev=${this.id},id=${this.id},mac=${this.macAddress}`];
	}

	getConfig() {
		return [this.getNetdevConfig(), this.getDeviceConfig()];
	}
}

class NetDeviceWithMultiplyForward {
	constructor(id, forwardMap, macAddress = generateQemuMacAddress()) {
		this.id = id;
		if (!Array.isArray(forwardMap)) {
			throw "forwardMap should be array"
		}
		this.forwardMap = forwardMap;
		this.macAddress = macAddress;
	}

	getNetdevConfig() {
		const forward = this.forwardMap.map(i => {
			return `hostfwd=tcp::${i.host}-:${this.vm}`
		})

		if (forward) {
			return ['-netdev', `user,id=${this.id}`];
		} else {
			return [`-netdev`, `user,id=${this.id},${forward.join(",")}`];
		}
	}

	getDeviceConfig() {
		return ['-device', `vmxnet3,netdev=${this.id},id=${this.id},mac=${this.macAddress}`];
	}

	getConfig() {
		return [this.getNetdevConfig(), this.getDeviceConfig()];
	}
}

module.exports = {
	NetDevice,
	NetDeviceWithMultiplyForward
}