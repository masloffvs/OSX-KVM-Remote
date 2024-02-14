const shell = require('shelljs');
const _ = require("lodash");
const {logger} = require("../logger");

class UnixVirtualization {
	_tool = 'qemu-system-x86_64'

	constructor(useTool = undefined) {
		if (useTool) {
			this._tool = useTool
		}

		if (shell && !shell.which(this._tool)) {
			logger.error(`Sorry, this script requires "${this._tool}"`, { namespace: 'UnixVirtualization' });
			process.exit(1);
		}
	}

	addListeners(options = {}) {
		// Callbacks for events
		this._onExit = options.onExit || undefined;
		this._onClose = options.onClose || undefined;
		this._onError = options.onError || undefined;
		this._onStdoutData = options.onStdoutData || undefined;
		this._onStdinData = options.onStdinData || undefined;
	}

	static buildOptionsToQemuArgsList(options = {}) {
		const _options = {
			allocatedRam: options.allocatedRam || '7192', // MiB
			cpuSockets: options.cpuSockets || '1',
			customDeviceParams: options.customDeviceParams,
			cpuCores: options.cpuCores || '2',
			cpuThreads: options.cpuThreads || '4',
			repoPath: options.repoPath || '.',
			ovmfDir: options.ovmfDir || '.',
			nographic: options.nographic ? '-nographic' : '',
			cpuType: options.cpuType || undefined,
			kvm: options.kvm !== false, // default true
			additionalCpuOptions: options.additionalCpuOptions || '+ssse3,+sse4.2,+popcnt,+avx,+aes,+xsave,+xsaveopt,check',
			usbDevices: options.usbDevices || ['-usb', '-device', 'usb-kbd', '-device', 'usb-tablet'],
			storageDevices: options.storageDevices || [],
			networkDevices: options.networkDevices || [],
			displayDevices: options.displayDevices || [],
			otherArgs: options.otherArgs || [],
			audioDevices: options.audioDevices || ['-device', 'ich9-intel-hda', '-device', 'hda-duplex'],
			ahciDevice: options.ahciDevice || []
		};

		if (!['Haswell-noTSX', "Penryn"].includes(options.cpuType)) {
			throw `The processor parameter 'cpuType' is incorrect (${options.cpuType})`
		}

		const {
			displayDevices, otherArgs, ahciDevice, audioDevices,
			allocatedRam, cpuSockets, cpuCores, cpuThreads,
			cpuType, kvm, additionalCpuOptions, usbDevices,
			storageDevices, nographic, networkDevices,
			customDeviceParams
		} = _options;

		const cpuOptions = `kvm=${kvm ? 'on' : 'off'},vendor=GenuineIntel,+invtsc,vmware-cpuid-freq=on,${additionalCpuOptions}`;

		const networkDeviceArgs = networkDevices.flatMap(device => device.getConfig());
		const storageDeviceArgs = storageDevices.map(device => device.getQemuDriveConfig());

		let _kvm = [ kvm ? '-enable-kvm' : undefined ]
		let _mem = [ '-m', allocatedRam ]
		let _cpu = [ '-cpu', `${cpuType},${cpuOptions}`, '-machine', 'q35' ]
			.concat([ '-smp', `${cpuThreads},cores=${cpuCores},sockets=${cpuSockets}` ])
			.concat([ nographic || undefined ])

		const _args = _.cloneDeep(
			[
				_mem,
				_cpu,
				_kvm,

				...(usbDevices || []),
				...(ahciDevice || []),
				...(audioDevices || []),
				...(storageDeviceArgs || []),
				...(networkDeviceArgs || []),
				...(displayDevices || []),
				...(customDeviceParams || []),
				...(otherArgs || [])
			]
		);

		return _.flatten(_args).filter(it => it)
	}

	/**
	 * @protected
	 * @param {string[]} argv
	 * @param {{silent: boolean}} opts
	 * @return {string}
	 */
	run(
		argv = [],
		opts = { silent:true }
	) {
		logger.debug(`${this._tool} ${_.flatten(argv).join(" ")}`, { namespace: 'UnixVirtualization' })
		return shell.exec(`${this._tool} ${_.flatten(argv).join(" ")}`, opts)
	}
}

module.exports = {UnixVirtualization}