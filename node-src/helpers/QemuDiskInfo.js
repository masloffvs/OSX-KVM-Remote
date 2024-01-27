const util = require('util');
const exec = util.promisify(require('child_process').exec);

function stringToCamelCase(inputString) {
	return inputString.replace(/[-_\s](.)/g, (_, group1) => group1.toUpperCase());
}

async function parseQemuDiskInfo(diskPath) {
	try {
		// Execute the 'qemu-img info' command to retrieve disk information
		const { stdout } = await exec(`qemu-img info ${diskPath}`);

		// Parse the output and create an object with the data
		const diskInfo = {};
		const lines = stdout.split('\n');
		lines.forEach((line) => {
			const parts = line.split(':');
			if (parts.length === 2) {
				const key = parts[0].trim();
				const value = parts[1].trim();
				diskInfo[stringToCamelCase(key)] = value;
			}
		});

		return (diskInfo);
	} catch (error) {
		console.error('Error while parsing disk information:', error);
		return null;
	}
}


module.exports = {
	parseQemuDiskInfo
}