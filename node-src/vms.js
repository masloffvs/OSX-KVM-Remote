const {logger} = require("./logger");
const {Throwable} = require("./Throwable");

const vms = new Proxy({}, {
	get(target, prop, receiver) {
		logger.debug(`get(vms["${prop}"])`)
		return target[prop];
	},

	set(target, p, newValue, receiver) {
		if (typeof newValue !== 'object') {
			throw new Throwable(
				"The new value of the virtual machine cannot be different from the object",
				vms,
				{
					classdump: newValue
				}
			)
		}

		if (!newValue.hasOwnProperty('proc') || !newValue.hasOwnProperty('runnable')) {
			throw new Throwable(
				"There are not enough parameters in the passed object",
				vms,
				{
					classdump: newValue,
					example: {
						proc: Object,
						runnable: Object
					}
				}
			)
		}

		logger.debug(`set(vms["${p}"], size:${newValue.toString().length})`)
		target[p] = newValue
	}
})

module.exports = {vms}