const {AppleVirtualDrive} = require("./AppleVirtualDrive");
const {normalize} = require("node:path");

const appleBootableHub = () => ({
	/**
	 * @type {AppleVirtualDrive}
	 */
	prebuilt: AppleVirtualDrive.of(
		normalize(`${process.cwd()}/OpenCore/OpenCore.qcow2`),
		'OpenCoreBoot',
		undefined,
		'qcow2',
		'OpenCoreBoot',
		{
			_if: "none",
			_snapshot: 'on'
		}
	)
})

module.exports = {
	AppleBootableHub: appleBootableHub()
}