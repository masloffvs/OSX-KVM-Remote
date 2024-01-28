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
					if (info.vm) {
						return `${info.timestamp} [${color.fg.yellow(info.vm)}] <${info.level}>: ${
							info.message
						}`
					} else {
						return `${info.timestamp} <${info.level}>: ${
							info.message
						}`
					}
				},
			),
		),
		transports: [new winston.transports.Console({})], // Log to the console
	})
}
