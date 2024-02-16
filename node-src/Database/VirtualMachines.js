const {LevelupDatabase} = require("./Levelup");
const _ = require("lodash");
const {input} = require("@inquirer/prompts");

class VirtualMachines {
	static saveVirtualMachine(label=undefined, name=undefined, {
		dataDrive,
		bootableDrive,
		baseSystemDrive,

		graphicMode,

		ramSize,
		cpuSize,
  }) {
		LevelupDatabase.get('vms', async function (err, value) {
			LevelupDatabase.put('vms', JSON.stringify({
				vms: _.get(JSON.parse(String(value || "{}")), 'vms', []).concat([
					{ name, link: `vm/${name}` }
				])
			}))

			LevelupDatabase.put(`vm/${name}`, JSON.stringify({
				name,
				label: label || name,
				wizard: {
					dataDrive,
					bootableDrive,
					baseSystemDrive,

					graphicMode,

					ramSize,
					cpuSize,
				}
			}))
		})
	}
}

module.exports = {VirtualMachines}