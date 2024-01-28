const QemuOpenCoreRunnable = require("./OpenCoreRunnable");
const {vncDisplay} = require("./helpers/VncDisplay");
const {driverDevice, VirtualDrive} = require("./helpers/Drive");
const {NetDeviceWithMultiplyForward} = require("./helpers/NetDevice");
const path = require("node:path");
const DiskLink = require("./DiskLink");

const netDevice = new NetDeviceWithMultiplyForward('net0', [
	// {
	// 	host: 2222,
	// 	vm: 22
	// }
]);

module.exports = {
	Machine: {
		sonoma(options) {
			const opt = Object.assign({
				kvm: process.platform === 'linux',
				nographic: true,
				networkDevices: [
					netDevice
				],
				storageDevices: [
					DiskLink.openCoreBoot,
					DiskLink.installMedia
				],
				customDeviceParams: [
					driverDevice('isa-applesmc', { osk: 'ourhardworkbythesewordsguardedpleasedontsteal(c)AppleComputerInc' }),
					driverDevice('nec-usb-xhci', { id: 'xhci' }),
					driverDevice('usb-ehci', { id: 'ehci' }),
					driverDevice('ich9-intel-hda'),
					driverDevice('hda-duplex'),
					driverDevice('ich9-ahci', { id: 'sata' }),
					driverDevice('ide-hd', { bus: 'sata.2', drive: 'OpenCoreBoot' }),
					driverDevice('ide-hd', { bus: 'sata.3', drive: 'InstallMedia' }),
				],
				otherArgs: [
					'-drive if=pflash,format=raw,readonly,file="./OVMF_CODE.fd"',
					'-drive if=pflash,format=raw,file="./OVMF_VARS-1024x768.fd"',
					'-smbios type=2'
				]
			}, options)

			return new QemuOpenCoreRunnable(opt)
		}
	}
}