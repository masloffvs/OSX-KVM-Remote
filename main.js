const QemuOpenCoreRunnable = require("./node-src/OpenCoreRunnable");
const {vncDisplayArguments} = require("./node-src/helpers/VncDisplay");
const {NetDevice} = require("./node-src/helpers/NetDevice");
const {driverDevice} = require("./node-src/helpers/Drive");
const DiskLink = require("./node-src/DiskLink");

const netDevice = new NetDevice('net0', 2212, 22);

const qemuOpenCoreRunnable = new QemuOpenCoreRunnable({
	kvm: false,
	networkDevices: [
		netDevice
	],
	storageDevices: [
		DiskLink.openCoreBoot,
		DiskLink.installSonomaMedia
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
	],

	...vncDisplayArguments()
});

const process = qemuOpenCoreRunnable.run()

console.log(process.pid)