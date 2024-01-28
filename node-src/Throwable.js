class Throwable {
	constructor(message, classname, params) {
		this.message = message
		this.classname = classname
		this.params = params
	}
}

module.exports = {Throwable}