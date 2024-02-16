const {LevelupDatabase} = require("./Levelup");
const _ = require("lodash");
const {input} = require("@inquirer/prompts");

class VirtualMachines {
	static saveVirtualMachine({dataStorageSize, operationSystemVersion, ram, graphic}) {
		LevelupDatabase.get('vms', async function (err, value) {
			LevelupDatabase.put('vms', JSON.stringify({
				vms: _.get(JSON.parse(String(value || "{}")), 'vms', []).concat([
					{ name, link: `vm/${name}` }
				])
			}))

			LevelupDatabase.put(`vm/${name}`, JSON.stringify({
				name,
				label: await input({ message: 'Enter label of VM', default: name }),
				wizard: {
					dataStorageSize,
					operationSystemVersion,
					ram,
					graphic
				}
			}))
		})
	}
}

module.exports = {VirtualMachines}