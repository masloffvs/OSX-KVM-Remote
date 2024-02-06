const _ = require("lodash");

const banner = ('CuKWiOKWiOKVl-KWkeKWkeKWiOKWiOKVl-KWiOKWiOKVl-KWkeKWkeKWkeKWiOKWiOKVl-KWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKVl-KWkeKWkeKWkeKWiOKWiOKVl-KWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKVl-KWkeKWiOKWiOKWiOKWiOKWiOKWiOKVl-KWkQrilojilojilZHilpHilpHilojilojilZHilZrilojilojilZfilpHilojilojilZTilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZTilZDilZDilZDilZDilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZHilpHilpHilpHilojilojilZHilojilojilZHilojilojilZTilZDilZDilZDilZDilZ3ilojilojilZTilZDilZDilojilojilZfilojilojilZTilZDilZDilojilojilZcK4paI4paI4paI4paI4paI4paI4paI4pWR4paR4pWa4paI4paI4paI4paI4pWU4pWd4paR4paI4paI4paI4paI4paI4paI4pWU4pWd4paI4paI4paI4paI4paI4pWX4paR4paR4paI4paI4paI4paI4paI4paI4pWU4pWd4pWa4paI4paI4pWX4paR4paI4paI4pWU4pWd4paI4paI4pWR4pWa4paI4paI4paI4paI4paI4pWX4paR4paI4paI4pWR4paR4paR4paI4paI4pWR4paI4paI4paI4paI4paI4paI4pWU4pWdCuKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVkeKWkeKWkeKVmuKWiOKWiOKVlOKVneKWkeKWkeKWiOKWiOKVlOKVkOKVkOKVkOKVneKWkeKWiOKWiOKVlOKVkOKVkOKVneKWkeKWkeKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVl-KWkeKVmuKWiOKWiOKWiOKWiOKVlOKVneKWkeKWiOKWiOKVkeKWkeKVmuKVkOKVkOKVkOKWiOKWiOKVl-KWiOKWiOKVkeKWkeKWkeKWiOKWiOKVkeKWiOKWiOKVlOKVkOKVkOKWiOKWiOKVlwrilojilojilZHilpHilpHilojilojilZHilpHilpHilpHilojilojilZHilpHilpHilpHilojilojilZHilpHilpHilpHilpHilpHilojilojilojilojilojilojilojilZfilojilojilZHilpHilpHilojilojilZHilpHilpHilZrilojilojilZTilZ3ilpHilpHilojilojilZHilojilojilojilojilojilojilZTilZ3ilZrilojilojilojilojilojilZTilZ3ilojilojilZHilpHilpHilojilojilZEK4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4paR4paR4pWa4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWd4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4paR4paR4paR4pWa4pWQ4pWd4pWa4pWQ4pWQ4pWQ4pWQ4pWQ4pWd4paR4paR4pWa4pWQ4pWQ4pWQ4pWQ4pWd4paR4pWa4pWQ4pWd4paR4paR4pWa4pWQ4pWd')

console.log(Buffer.from(banner, 'base64').toString())
console.log('')
console.log(' Welcome to the Hypervisor for MacOS Images')
console.log(' Attention! THIS IS NOT A STABLE BUILD. USE IT FOR EXPERIMENTATION ONLY')
console.log('')
console.log(' Credits (without them this fork would not exist)')
console.log('  - https://github.com/kholia/OSX-KVM')
console.log('  - https://github.com/sickcodes/Docker-OSX')
console.log('  - https://github.com/sickcodes/osx-serial-generator')
console.log('')

const {createFolderIfNotExists, checkFileExists} = require("./node-src/boot");
const {config} = require("./node-src/config");

checkFileExists(process.cwd() + "/OVMF_VARS-1024x768.fd")
checkFileExists(process.cwd() + "/OVMF_CODE.fd")
checkFileExists(process.cwd() + "/.vnc-port")
checkFileExists(process.cwd() + "/hypervisor.json")

createFolderIfNotExists('.cache')
createFolderIfNotExists('.snapshots')
createFolderIfNotExists('.tty')
createFolderIfNotExists('data')
createFolderIfNotExists('data/bootable')
createFolderIfNotExists('data/hdd')
createFolderIfNotExists('disks')

for (const plist of _.get(config, 'plists', [])) {
	checkFileExists(process.cwd() + `/osx-serial-generator/${plist}`)
}

require("./node-src/app").spawnWebServer()