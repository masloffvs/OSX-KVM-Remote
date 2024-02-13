const {AppleVirtualDrive} = require("./AppleVirtualDrive");
const {normalize} = require("node:path");

const appleBaseSystemHub = () => ({
	Sonoma: AppleVirtualDrive.of(
		normalize(`${process.cwd()}/prebuilt/basesystems/BaseSystem-Sonoma.img`),
		'InstallMedia',
		undefined,
		'raw',
		'InstallMedia',
		{
			_if: "none",
			_snapshot: 'on'
		}
	)
})

module.exports = {
	AppleBaseSystemHub: appleBaseSystemHub()
}