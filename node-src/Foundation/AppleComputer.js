const {MediaSonoma, driverDevice} = require("../helpers/Drive");
const {NetDeviceWithMultiplyForward} = require("../helpers/NetDevice");
const {app} = require("../app");
const _ = require("lodash");
const QemuOpenCoreRunnable = require("../OpenCoreRunnable");
const {UnixVirtualization} = require("./UnixVirtualization");
const {Throwable} = require("../Throwable");

class AppleComputer extends UnixVirtualization {
	/**
	 * @private
	 * @type {{}}
	 * @private
	 */
	_unixVirtualizationFinalArguments = {}

	/**
	 * @private
	 * @type {{host: number, vm: number}[]}
	 * @private
	 */
	_portForwarding = []

	/**
	 * @private
	 * @type {AppleVirtualDrive[]}
	 * @private
	 */
	_virtualDevicesDrives = []

	/**
	 * @private
	 * @type {AppleVirtualDrive[]}
	 * @private
	 */
	_virtualDataDrives = []

	/**
	 * @private
	 * @type {PhantomFile[]}
	 * @private
	 */
	_ovmfFiles = []

	/**
	 * @private
	 * @type {[]}
	 * @private
	 */
	_display = []

	/**
	 * @private
	 * @type {[]}
	 * @private
	 */
	_vnc = []

	/**
	 * @private
	 * @type {[]}
	 * @private
	 */
	_sataPort = []

	/**
	 * @private
	 * @type {string}
	 * @private
	 */
	_hypervisorVmx = "hypervisor=off,vmx=on"

	/**
	 * @private
	 * @type {number}
	 * @private
	 */
	_ram = 1024

	/**
	 * @private
	 * @type {string}
	 * @private
	 */
	_newInterface = 'net0'

	/**
	 * @private
	 * @type {boolean}
	 * @private
	 */
	_enableGraphic = true

	/**
	 * @private
	 * @type {*}
	 * @private
	 */
	_accel = undefined

	setPortForward(host, vm) {
		this._portForwarding.push({
			host,
			vm
		})

		return this
	}

	setVersionSystem(osVersion = 'ventura') {
		if (!['sonoma', 'ventura'].includes(osVersion)) {
			throw new Throwable(
				`An unsupported system version type was specified (${osVersion})`,
				AppleComputer,
				{ classdump: this }
			)
		}
		this._unixVirtualizationFinalArguments['cpuType'] = String(osVersion).toLowerCase() !== 'sonoma' ? 'Penryn' : 'Haswell-noTSX'
		return this
	}


	/**
	 * Apple computers do not have the usual KVM.
	 * Therefore, the AppleComputer class disables KVM on Apple devices if OSX-KVM is running
	 * on a Macintosh Host machine.
	 * But you can use accelerators that are built into Apple - hvf
	 *
	 * @param {'hvf'|'kvm'} accel
	 * @return {AppleComputer}
	 */
	useAppleKvm(accel = 'hvf') {
		this._accel = accel

		return this
	}

	/**
	 *
	 * @param {AppleVirtualDrive} appleVirtualDrive
	 * @param sataPort
	 * @return {AppleComputer}
	 */
	setDrive(appleVirtualDrive, sataPort = undefined) {
		if (appleVirtualDrive) {
			this._virtualDevicesDrives.push(appleVirtualDrive)

			if (sataPort) {
				return this.useSataPortWithDrive(parseInt(sataPort), appleVirtualDrive._label)
			}
		}

		return this
	}

	setRam(ramSize = 0) {
		this._ram = ramSize

		return this
	}

	useSataPortWithDrive(sataNumber = 0, driveName = 'Untitled') {
		this._sataPort.push({ sataNumber, driveName })

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

	/**
	 * @private
	 * @return {string[]}
	 */
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

	/**
	 * @private
	 * @return {{kvm: boolean, networkDevices: NetDeviceWithMultiplyForward[], allocatedRam: string, otherArgs: *[], nographic: boolean, audioDevices: *[], displayDevices: *[], additionalCpuOptions: string}}
	 */
	options() {
		const virtualDrivers =  this._virtualDevicesDrives.map(disk => disk._q())
		const dataDrive = this._virtualDataDrives.map(disk => disk._q())

		const sataPorts = this._sataPort.map(sata => {
			return driverDevice('ide-hd', { bus: `sata.${sata.sataNumber}`, drive: sata.driveName })
		})

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
				.concat(sataPorts)
				.concat([this._accel ? `-accel ${this._accel}` : undefined])
				.concat(['-vga vmware', '-monitor unix:qemu-monitor-socket,server,nowait'])
		)

		return {
			kvm: process.platform === 'linux',
			allocatedRam: String(this._ram),
			nographic: this._enableGraphic,
			networkDevices: [
				new NetDeviceWithMultiplyForward(this._newInterface, this._portForwarding)
			],

			displayDevices: [],
			audioDevices: [],

			additionalCpuOptions: `${this._hypervisorVmx},`,
			otherArgs: args
		}
	}

	/**
	 * @deprecated
	 * @return {QemuOpenCoreRunnable}
	 */
	spawnQemuRunnable() {
		return new QemuOpenCoreRunnable(this.options())
	}

	/**
	 * @private
	 * @return {unknown[] | *}
	 */
	spawnQemuArguments() {
		const finalArgs = Object.assign(
			this.options(),
			this._unixVirtualizationFinalArguments
		)

		return UnixVirtualization.buildOptionsToQemuArgsList(finalArgs)
	}

	spawnAndRunComputer() {
		return this.run(this.spawnQemuArguments(), {silent: false})
	}
}

module.exports = {AppleComputer}