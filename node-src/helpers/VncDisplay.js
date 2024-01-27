const {isFreePort} = require('find-free-ports');

_factoryPorts = [...Array(99).keys()].map(i => i + 4901)
_factoryPortsUsed = []

function nextVncPort() {
	const port = _factoryPorts.filter(i => !_factoryPortsUsed.includes(i))[0]

	if (port) {
		_factoryPortsUsed.push(port)
	}

	return port
}

async function findFreeVncPort(startPort = 5901, endPort = 5999) {
	for (let port = startPort; port <= endPort; port++) {
		if (await isFreePort(port)) {
			return port
		}
	}

	return null
}

function vncDisplay(
	host = this.MACHINE_HOST,
	port = 1,
	passwordEnabled = false
) {
	if (host === undefined) {
		host = this.LOCAL_HOST
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
	findFreeVncPort,
	nextVncPort,

	vncDisplayArguments({host, port}) {
		return {
			nographic: true,
			displayDevices: vncDisplay(
				String(host) || undefined,
				parseInt(port) || 1,
			),
		}
	}
}