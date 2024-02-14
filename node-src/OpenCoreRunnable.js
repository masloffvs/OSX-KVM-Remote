const { exec } = require('node:child_process');
const _ = require("lodash");

class QemuOpenCoreRunnable {
	_args = undefined

	/**
	 * Create a new instance of the QemuOpenCoreRunnable class.
	 * @param {{storageDevices: VirtualDrive[], kvm: boolean, networkDevices: NetDeviceWithMultiplyForward[], otherArgs: string[], nographic: boolean, customDeviceParams: string[]}} options - Configuration options for the virtual machine.
	 * @param {string} [options.allocatedRam='7192'] - The amount of allocated RAM in MiB.
	 * @param {function} [options.onStdoutData]
	 * @param {function} [options.onStdinData]
	 * @param {function} [options.onError]
	 * @param {function} [options.onClose]
	 * @param {function} [options.onExit]
	 * @param {boolean} [options.nographic]
	 * @param {string[]} [options.customDeviceParams]
	 * @param {string} [options.cpuSockets='1'] - The number of CPU sockets.
	 * @param {string} [options.cpuCores='2'] - The number of CPU cores.
	 * @param {string} [options.cpuThreads='4'] - The number of CPU threads.
	 * @param {string} [options.repoPath='.'] - The path to the OpenCore repository.
	 * @param {string} [options.ovmfDir='.'] - The path to the OVMF (Open Virtual Machine Firmware) directory.
	 * @param {'Haswell-noTSX'|'Penryn'} [options.cpuType='Haswell-noTSX'] - The CPU type.
	 * @param {boolean} [options.kvm=true] - Enable or disable KVM (Kernel-based Virtual Machine) support.
	 * @param {string} [options.additionalCpuOptions='+ssse3,+sse4.2,+popcnt,+avx,+aes,+xsave,+xsaveopt,check'] - Additional CPU options.
	 * @param {string[]} [options.usbDevices=['-usb', '-device', 'usb-kbd', '-device', 'usb-tablet']] - USB device options.
	 * @param {string[]} [options.storageDevices=[]] - Storage device options.
	 * @param {string[]} [options.networkDevices=[NetDevice]] - Network device options.
	 * @param {string[]} [options.displayDevices=['-device', 'vmware-svga', '-display', 'none', '-vnc', '0.0.0.0:12,password=off', '-k', 'en-us']] - Display device options.
	 * @param {string[]} [options.otherArgs=[]] - Additional command-line arguments.
	 */
	constructor(options = {}) {
		this.options = {
			allocatedRam: options.allocatedRam || '7192', // MiB
			cpuSockets: options.cpuSockets || '1',
			customDeviceParams: options.customDeviceParams,
			cpuCores: options.cpuCores || '2',
			cpuThreads: options.cpuThreads || '4',
			repoPath: options.repoPath || '.',
			ovmfDir: options.ovmfDir || '.',
			nographic: options.nographic ? '-nographic' : '',
			cpuType: options.cpuType || 'Haswell-noTSX',
			kvm: options.kvm !== false, // default true
			additionalCpuOptions: options.additionalCpuOptions || '+ssse3,+sse4.2,+popcnt,+avx,+aes,+xsave,+xsaveopt,check',
			usbDevices: options.usbDevices || ['-usb', '-device', 'usb-kbd', '-device', 'usb-tablet'],
			storageDevices: options.storageDevices || [],
			networkDevices: options.networkDevices || [],
			displayDevices: options.displayDevices || ['-device', 'vmware-svga'],
			otherArgs: options.otherArgs || [],
			audioDevices: options.audioDevices || ['-device', 'ich9-intel-hda', '-device', 'hda-duplex'],
			ahciDevice: options.ahciDevice || []
		};

		if (!['Haswell-noTSX', "Penryn"].includes(this.options.cpuType)) {
			throw "The processor parameter 'cpuType' is incorrect"
		}

		// Callbacks for events
		this.onExit = options.onExit || undefined;
		this.onClose = options.onClose || undefined;
		this.onError = options.onError || undefined;
		this.onStdoutData = options.onStdoutData || undefined;
		this.onStdinData = options.onStdinData || undefined;
	}



	/**
	 * Builds the command-line arguments for running the virtual machine.
	 * @private
	 * @returns {string[]} An array of command-line arguments.
	 */
	_buildArgs() {
		if (!this._args) {
			const {
				allocatedRam, cpuSockets, cpuCores, cpuThreads, repoPath, ovmfDir,
				cpuType, kvm, additionalCpuOptions, usbDevices, storageDevices, nographic,
				networkDevices, displayDevices, otherArgs, ahciDevice, audioDevices, customDeviceParams
			} = this.options;

			const cpuOptions = `kvm=${kvm ? 'on' : 'off'},vendor=GenuineIntel,+invtsc,vmware-cpuid-freq=on,${additionalCpuOptions}`;

			const networkDeviceArgs = networkDevices.flatMap(device => device.getConfig());
			const storageDeviceArgs = storageDevices.map(device => device.getQemuDriveConfig());

			this._args = Object.freeze([
				[kvm ? '-enable-kvm' : undefined],
				['-m', allocatedRam, '-cpu', `${cpuType},${cpuOptions}`, '-machine', 'q35', (nographic || undefined)],
				['-smp', `${cpuThreads},cores=${cpuCores},sockets=${cpuSockets}`],
				...(usbDevices || []),
				...(ahciDevice || []),
				...(audioDevices || []),
				...(storageDeviceArgs || []),
				...(networkDeviceArgs || []),
				...(displayDevices || []),
				...(customDeviceParams || []),
				...(otherArgs || [])
			]);
		}

		return this._args
	}

	getArgs(flatten = true) {
		if (flatten) {
			return _.flatten(this._buildArgs()).filter(it => it)
		} else {
			return this._buildArgs()
		}
	}

	setArgs(args) {
		this._args = args
	}

	/**
	 * Run the virtual machine with the configured options.
	 */
	run() {
		const args = this._buildArgs();
		const qemuProcess = exec(`qemu-system-x86_64 ${args.join(' ')}`);

		// qemuProcess.stdin.on('error', console.log)
		// qemuProcess.stderr.on('error', console.log)
		// qemuProcess.stderr.on('data', console.log)

		// qemuProcess.stdio
		qemuProcess.stdout.on('data', (data) => {
			if (this.onStdoutData === undefined) {
				process.stdout.write(data)
			} else if (this.onStdoutData !== null) {
				this.onStdoutData(data);
			}
		});


		qemuProcess.stdin.on('data', (data) => {
			if (this.onStdinData === undefined) {
				process.stdin.write(data)
			} else if (this.onStdoutData !== null) {
				this.onStdinData(data);
			}
		});

		qemuProcess.stderr.on('data', (data) => {
			console.error(data)
		});

		qemuProcess.on('exit', (code, signal) => {
			if (this.onExit === undefined) {
				console.error({
					code, signal
				})
			} else if (this.onExit !== null) {
				this.onExit({
					code, signal
				});
			}
		});

		qemuProcess.on('close', (code, signal) => {
			if (this.onClose === undefined) {
				console.error({
					code, signal
				})
			} else if (this.onClose !== null) {
				this.onClose({
					code, signal
				});
			}
		});

		qemuProcess.on('error', (error) => {
			if (this.onError === undefined) {
				console.error({
					error
				})
			} else if (this.onError !== null) {
				this.onError({
					error
				});
			}
		});

		return qemuProcess
	}
}

module.exports = QemuOpenCoreRunnable
