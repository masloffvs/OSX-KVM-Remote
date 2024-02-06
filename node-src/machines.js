const QemuOpenCoreRunnable = require("./OpenCoreRunnable");
const {vncDisplay} = require("./helpers/VncDisplay");
const {driverDevice, VirtualDrive} = require("./helpers/Drive");
const {NetDeviceWithMultiplyForward} = require("./helpers/NetDevice");
const path = require("node:path");
const DiskLink = require("./DiskLink");
const {PhantomFile} = require("./helpers/PhantomFile");
const fs = require("node:fs");
const {createRandomMacOSHDD, MASTER_PLISTS} = require("./utils/serialDisk");
const {R_OK} = require("constants");
const {Throwable} = require("./Throwable");

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

async function spawnBootableDiskWithUniqData(
	pathToDisk,
	materPlist
) {
	let optionsOfUniqMacHDD = null

	if (!fs.existsSync(materPlist)) {
		throw new Throwable(
			`The plist file was not found at path "${pathToDisk}"`,
			spawnBootableDiskWithUniqData,
			{
				pathToDisk,
				materPlist
			}
		)
	}

	if (fs.existsSync(pathToDisk)) {
		throw new Throwable(
			`The disk along the path "${pathToDisk}" already exists and cannot be overwritten to protect your data`,
			spawnBootableDiskWithUniqData,
			{
				pathToDisk,
				materPlist
			}
		)
	}

	optionsOfUniqMacHDD = await createRandomMacOSHDD(pathToDisk, materPlist)
	fs.accessSync(pathToDisk, R_OK)

	const openCoreBoot = new VirtualDrive(
		Infinity,
		'qcow2',
		'OpenCoreBoot',
		pathToDisk,
		undefined,
		'none'
	);


	return {
		optionsOfUniqMacHDD,
		openCoreBoot,
		pathToDisk,
		materPlist
	}
}

const ovmfCodeFile = new PhantomFile({
	path: path.normalize(process.cwd() + "/OVMF_CODE.fd")
})

const ovmfVars1024x768File = new PhantomFile({
	path: path.normalize(process.cwd() + "/OVMF_VARS-1024x768.fd"
)})

module.exports = {
	Machine: {
		async sonoma(options, diskDrive, bootableDiskDrive) {
			if (!path.isAbsolute(diskDrive)) {
				throw new Throwable(
					"The path to the bootloader disk is not absolute",
					this.sonoma,
					{}
				)
			}

			const dataDrive = spawnDataDrive(diskDrive)

			const openCoreDisk = await spawnBootableDiskWithUniqData(
				path.normalize(bootableDiskDrive),
				MASTER_PLISTS.sonoma
			)

			const opt = Object.assign({
				kvm: process.platform === 'linux',
				nographic: true,
				networkDevices: [
					netDevice
				],
				storageDevices: [
					openCoreDisk.openCoreBoot,
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

		async ventura(options, diskDrive, bootableDiskDrive) {
			if (!path.isAbsolute(diskDrive)) {
				throw new Throwable(
					"The path to the bootloader disk is not absolute",
					this.sonoma,
					{}
				)
			}

			const dataDrive = spawnDataDrive(diskDrive)

			const openCoreDisk = await spawnBootableDiskWithUniqData(
				path.normalize(bootableDiskDrive),
				MASTER_PLISTS.sonoma
			)

			const opt = Object.assign({
				kvm: process.platform === 'linux',
				cpuType: "Penryn",
				nographic: true,
				networkDevices: [
					netDevice
				],
				storageDevices: [
					openCoreDisk.openCoreBoot,
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