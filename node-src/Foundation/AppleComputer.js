const {MediaSonoma, driverDevice} = require("../helpers/Drive");
const {NetDeviceWithMultiplyForward} = require("../helpers/NetDevice");
const {app} = require("../app");
const _ = require("lodash");
const QemuOpenCoreRunnable = require("../OpenCoreRunnable");

class AppleComputer {
	/**
	 * @type {{host: number, vm: number}[]}
	 * @private
	 */
	_portForwarding = []
	/**
	 * @type {AppleVirtualDrive[]}
	 * @private
	 */
	_virtualDevicesDrives = []
	/**
	 * @type {AppleVirtualDrive[]}
	 * @private
	 */
	_virtualDataDrives = []
	/**
	 * @type {PhantomFile[]}
	 * @private
	 */
	_ovmfFiles = []
	_display = []
	_vnc = []
	_hypervisorVmx = "hypervisor=off,vmx=on"

	_newInterface = 'net0'
	_enableGraphic = true

	setPortForward(host, vm) {
		this._portForwarding.push({
			host,
			vm
		})

		return this
	}

	setDrive(appleVirtualDrive) {
		this._virtualDevicesDrives.push(appleVirtualDrive)

		return this
	}

	setEnableGraphic(enableGraphic = true) {
		this._enableGraphic = enableGraphic

		return this
	}

	setDisplay(display = 'vga') {
		// this._display.push([`-display ${display}`])

		return this
	}

	setOvmf(appleOvmfFile) {
		this._ovmfFiles.push(appleOvmfFile)

		return this
	}

	setDataDrive(appleVirtualDrive) {
		this._virtualDataDrives.push(appleVirtualDrive)

		return this
	}

	setHypervisorVmxConfig(hypervisor=false, vmx=true) {
		this._hypervisorVmx = `hypervisor=${hypervisor ? 'on' : 'off'},vmx=${vmx ? 'on' : 'off'},`

		return this
	}

	setEnableVnc(host = '127.0.0.1', port = 1) {
		this._vnc.push(
			`-vnc ${host}:${port} -k en-us`
		)

		return this
	}

	buildDeviceParamsList() {
		const OSK = 'ourhardworkbythesewordsguardedpleasedontsteal(c)AppleComputerInc'

		return [
			driverDevice('isa-applesmc', { osk: OSK }),
			driverDevice('nec-usb-xhci', { id: 'xhci' }),
			driverDevice('usb-ehci', { id: 'ehci' }),
			driverDevice('ich9-intel-hda'),
			driverDevice('hda-duplex'),
			driverDevice('ich9-ahci', { id: 'sata' }),
			driverDevice('ide-hd', { bus: 'sata.2', drive: 'OpenCoreBoot' }),
			driverDevice('ide-hd', { bus: 'sata.3', drive: 'InstallMedia' }),
		]
	}

	options() {
		const virtualDrivers =  this._virtualDevicesDrives.map(disk => disk._q())
		const dataDrive = this._virtualDataDrives.map(disk => disk._q())

		const dataDriveLinkArgs = this._virtualDataDrives
			.map((i, index) => {
				return driverDevice('ide-hd', { bus: `sata.${4 + index}`, drive: i._label })
			})

		const ovmfArgs = this._ovmfFiles.map(ovmf => {
			return ['-drive', `if=pflash,format=raw,file="${ovmf.createPhantomFile()}"`]
		})

		const args = _.uniq(
			[]
				.concat(virtualDrivers)
				.concat(dataDrive)
				.concat(ovmfArgs)
				.concat(this._display)
				.concat(this._vnc)
				.concat(this.buildDeviceParamsList())
				.concat([
					['-smbios', 'type=2']
				])
				.concat(dataDriveLinkArgs)
				.concat(['-vga vmware', '-monitor unix:qemu-monitor-socket,server,nowait'])
		)

		return Object.assign({
			kvm: process.platform === 'linux',
			nographic: this._enableGraphic,
			networkDevices: [
				new NetDeviceWithMultiplyForward(this._newInterface, this._portForwarding)
			],

			displayDevices: [],
			audioDevices: [],

			additionalCpuOptions: `${this._hypervisorVmx},`,
			otherArgs: args
		}, {})
	}

	spawnQemuRunnable() {
		return new QemuOpenCoreRunnable(this.options())
	}

	start() {

	}
}

module.exports = {AppleComputer}