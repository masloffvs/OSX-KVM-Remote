const QemuOpenCoreRunnable = require("./OpenCoreRunnable");
const {vncDisplay} = require("./helpers/VncDisplay");
const {driverDevice, VirtualDrive} = require("./helpers/Drive");
const {NetDeviceWithMultiplyForward} = require("./helpers/NetDevice");
const path = require("node:path");
const DiskLink = require("./DiskLink");
const {PhantomFile} = require("./helpers/PhantomFile");

const netDevice = new NetDeviceWithMultiplyForward('net0', [
	// {
	// 	host: 2222,
	// 	vm: 22
	// }
]);


function spawnDataDrive(diskPath) {
	return new VirtualDrive(
		Infinity,
		'qcow2',
		'MacHDD', // dont change it pls
		path.normalize(diskPath),
		undefined,
		'none',
		false
	)
}

const ovmfCodeFile = new PhantomFile({
	path: path.normalize(process.cwd() + "/OVMF_CODE.fd")
})

const ovmfVars1024x768File = new PhantomFile({
	path: path.normalize(process.cwd() + "/OVMF_VARS-1024x768.fd"
)})

module.exports = {
	Machine: {
		sonoma(options, diskDrive) {
			const dataDrive = spawnDataDrive(diskDrive)

			const opt = Object.assign({
				kvm: process.platform === 'linux',
				nographic: true,
				networkDevices: [
					netDevice
				],
				storageDevices: [
					DiskLink.openCoreBoot.createGhostDrive(),
					DiskLink.installSonomaMedia.createGhostDrive(),
					dataDrive
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
					`-device ide-hd,bus=sata.4,drive=${dataDrive.id || dataDrive.label}`,
					`-drive if=pflash,format=raw,file="${ovmfCodeFile.createTempPersistentFile()}"`,
					`-drive if=pflash,format=raw,file="${ovmfVars1024x768File.createTempPersistentFile()}"`,
					'-smbios type=2',
				]
			}, options)

			return new QemuOpenCoreRunnable(opt)
		},

		ventura(options, diskDrive) {
			const dataDrive = spawnDataDrive(diskDrive)

			const opt = Object.assign({
				kvm: process.platform === 'linux',
				cpuType: "Penryn",
				nographic: true,
				networkDevices: [
					netDevice
				],
				storageDevices: [
					DiskLink.openCoreBoot.createGhostDrive(),
					DiskLink.installVenturaMedia.createGhostDrive(),
					dataDrive
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
					`-device ide-hd,bus=sata.4,drive=${dataDrive.id || dataDrive.label}`,
					`-drive if=pflash,format=raw,file="${ovmfCodeFile.createTempPersistentFile()}"`,
					`-drive if=pflash,format=raw,file="${ovmfVars1024x768File.createTempPersistentFile()}"`,
					'-smbios type=2'
				]
			}, options)

			return new QemuOpenCoreRunnable(opt)
		}
	}
}