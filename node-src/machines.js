const QemuOpenCoreRunnable = require("./OpenCoreRunnable");
const {vncDisplay} = require("./helpers/VncDisplay");
const {driverDevice, VirtualDrive} = require("./helpers/Drive");
const {NetDeviceWithMultiplyForward} = require("./helpers/NetDevice");
const path = require("node:path");

const netDevice = new NetDeviceWithMultiplyForward('net0', [
	// {
	// 	host: 2222,
	// 	vm: 22
	// }
]);

const openCoreBoot = new VirtualDrive(
	Infinity,
	'qcow2',
	'OpenCoreBoot',
	path.normalize(process.cwd() + '/OpenCore/OpenCore.qcow2')
);

const installMedia = new VirtualDrive(
	Infinity,
	'raw',
	'InstallMedia',
	path.normalize(process.cwd() + '/prebuilt/basesystems/BaseSystem-Sonoma.img'),
	undefined,
	'none',
	false
);

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
					openCoreBoot,
					installMedia
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