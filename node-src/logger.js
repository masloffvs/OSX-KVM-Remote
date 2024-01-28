const winston = require('winston');
const winstonTimestampColorize = require("winston-timestamp-colorize");

module.exports = {
	logger: winston.createLogger({
		level: 'silly',
		format: winston.format.combine(
			// Combine multiple formats
			winston.format.splat(), // Interpolate variables in the log message
			winston.format.timestamp(), // Add a timestamp to log entries
			winston.format.colorize(), // Colorize log messages
			winstonTimestampColorize({ color: "gray" }), // Colorize timestamp
			winston.format.printf(
				// Custom printf formatter
				(info) => {
					let text = info.message

					if (typeof info.message === 'object') {
						text = JSON.stringify(info.message)

						if (info.message.request && info.message.response) {
							const r = info.message.request

							text = `${r.method} (${r.url})`
						}
					}

					if (info.vm) {
						return `${info.timestamp} [${color.fg.yellow(info.vm)}] <${info.level}>: ${
							text
						}`
					} else {
						return `${info.timestamp} <${info.level}>: ${
							text
						}`
					}
				},
			),
		),
		transports: [new winston.transports.Console({})], // Log to the console
	})
}
