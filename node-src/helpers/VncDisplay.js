const {Throwable} = require("../Throwable");

function vncDisplay(
	host = this.MACHINE_HOST,
	port = 1,
	passwordEnabled = false
) {
	if (host === undefined) {
		throw new Throwable(
			"The VNC host value must refer to an existing network address and be neither an empty string nor null, undefined",
			this.vncDisplayArguments,
			{host, port}
		)
	}

	if (!port) {
		throw new Throwable(
			"VNC port must be a positive integer",
			this.vncDisplayArguments,
			{host, port}
		)
	}


	if (passwordEnabled === true) {
		console.log(":(")
	}

	return ['-display', 'none', '-vnc', `${host}:${port},password=${passwordEnabled ? 'on' : 'off'}`]
}

module.exports = {
	LOCAL_HOST: '127.0.0.1',
	MACHINE_HOST: '127.0.0.1',

	vncDisplay,

	vncDisplayArguments({host, port} = {host: this.LOCAL_HOST, port: 1}) {
		return {
			displayDevices: vncDisplay(
				String(host),
				parseInt(String(port)),
			),
		}
	}
}