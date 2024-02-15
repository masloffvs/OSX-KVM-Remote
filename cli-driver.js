const { copySync } = require('fs-extra');
const { program } = require('commander');
const { input, select, confirm } = require('@inquirer/prompts');
const {AppleBootable} = require("./node-src/Foundation/AppleBootable");
const {logger} = require("./node-src/logger");
const fs = require("node:fs");
const {LevelupDatabase} = require("./node-src/Database/Levelup");
const _ = require("lodash");
const {AppleVirtualDrive} = require("./node-src/Foundation/AppleVirtualDrive");
const {AppleBaseSystemHub} = require("./node-src/Foundation/AppleBasesystemHub");
const {UnixVirtualization} = require("./node-src/Foundation/UnixVirtualization");
const {AppleComputer} = require("./node-src/Foundation/AppleComputer");
const {createFolderIfNotExists, checkFileExists} = require("./node-src/boot");
const {config} = require("./node-src/config");
const {AppleDisk} = require("./node-src/Foundation/AppleDisk");
const {PhantomFile} = require("./node-src/helpers/PhantomFile");
const {AppleBootableHub} = require("./node-src/Foundation/AppleBootableHub");
const path = require("node:path");

createFolderIfNotExists('data')
createFolderIfNotExists('data/generated')
createFolderIfNotExists('data/bootable')
createFolderIfNotExists('data/hdd')

checkFileExists(process.cwd() + "/OVMF_VARS-1024x768.fd")
checkFileExists(process.cwd() + "/OVMF_CODE.fd")
checkFileExists(process.cwd() + "/.vnc-port")
checkFileExists(process.cwd() + "/hypervisor.json")
checkFileExists(process.cwd() + "/app.json")

for (const plist of _.get(config, 'plists', [])) {
	checkFileExists(process.cwd() + `/osx-serial-generator/${plist}`)
}

async function generateWizardData() {
	const dataStorageSize = parseInt(await select({
		message: 'Select data storage size in GB',
		choices: _.range(64, 1000, 32).map(size => ({
			name: `${size} GB`,
			value: size,
			// description: '',
		}))
	}))

	const operationSystemVersion =  await select({
		message: 'Select a operation system',
		choices: [
			{
				name: 'sonoma',
				value: 'sonoma',
				description: 'macOS Sonoma 14.0',
			},
			{
				name: 'ventura',
				value: 'ventura',
				description: 'macOS Ventura 13.0',
			},
		],
	})

	const ram = parseInt(await select({
		message: 'Select the amount of RAM',
		choices: _.range(1024, 1024 * 32, 1024).map(size => ({
			name: `${size} MB`,
			value: size,
			// description: '',
		}))
	}))

	const graphic = parseInt(await select({
		message: 'How graphics work',
		choices: [
			{
				name: `VNC`,
				value: 'vnc',
				description: 'Use VNC',
			},
			{
				name: `Default graphic`,
				value: 'graphic',
				description: 'QEMU default',
			}
		]
	}))

	return {
		dataStorageSize,
		operationSystemVersion,
		ram,
		graphic
	}
}

program
	.option("--size <size>", "Size of disk")
	.option("--force")
	.command("create-disk <name>")
	.description('Create a hard drive')
	.action(async (name) => {
		const opts = program.opts()

		const disk =
			await AppleDisk
				.of(name)
				.spawnImage(opts.force)

		console.log(disk.dump())
	})


program
	.command("spawn-random-bootable-data")
	.description('Create a JSON file to generate a MacOS Bootable disk')
	.action(async () => {
		const {AppleBootable} = require("./node-src/Foundation/AppleBootable");

		console.log(JSON.stringify(AppleBootable.spawnData(), null, 2))
	})

program
	.command("spawn-random-bootable-disk <name>")
	.description('Create a hard drive for the OpenCore bootloader. Uses a random set of data to identify a computer')
	.action(async (name) => {
		const {AppleBootable} = require("./node-src/Foundation/AppleBootable");

		if (!fs.existsSync(`${process.cwd()}/data/generated/`)) {
			fs.mkdirSync(`${process.cwd()}/data/generated/`, {
				recursive: true
			})
		}

		const data = Object.assign(AppleBootable.spawnData(), {
			OUTPUT_QCOW: `${process.cwd()}/data/generated/${name}.qcow2`
		})

		logger.debug(JSON.stringify(data, null, 2))

		AppleBootable
			.spawnDisk(data)
			.then(logger.info)
			.catch(logger.error)
			.finally(() => process.exit(0))
	})

program
	.command("spawn-vm <name>")
	.description('Utility for creating MacOS VMs. Simplified version')
	.action(async name => {
		const { LevelupDatabase } = require("./node-src/Database/Levelup");

		const {
			dataStorageSize,
			operationSystemVersion,
			ram,
			graphic
		} = await generateWizardData()

		LevelupDatabase.get('vms', async function (err, value) {
			LevelupDatabase.put('vms', JSON.stringify({
				vms: _.get(JSON.parse(String(value || "{}")), 'vms', []).concat([
					{ name, link: `vm/${name}` }
				])
			}))

			LevelupDatabase.put(`vm/${name}`, JSON.stringify({
				name,
				label: await input({ message: 'Enter label of VM', default: name }),
				wizard: {
					dataStorageSize,
					operationSystemVersion,
					ram,
					graphic
				}
			}))
		})
	})

program
	.command("show-vms")
	.description('Show all virtual machines')
	.action(async () => {
		const { LevelupDatabase } = require("./node-src/Database/Levelup");

		LevelupDatabase.get('vms', function (e, data) {
			const objects = JSON.parse(String(data))

			console.table(_.get(objects, 'vms', []))
		})
	})

program
	.command("killall-qemu-instances")
	.description('Kill all instances of QEMU')
	.action(async () => {
		console.log(require('kill-process-by-name')("qemu-system-x86_64"))
	})

program
	.command("show-vm <name>")
	.description('Show virtual machine')
	.action(async (name) => {
		const { LevelupDatabase } = require("./node-src/Database/Levelup");

		LevelupDatabase.get(`vm/${name}`, function (e, data) {
			const object = JSON.parse(String(data || '{}'))

			console.info(object)
		})
	})


program
	.command("create-vm <name>")
	.description('Create virtual machine record. To create a virtual machine in simple mode, use the spawn-vm utility')
	.action(async (name) => {
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

		const {AppleOVMF} = require("./node-src/Foundation/AppleOVMF");
		const {AppleDisk} = require("./node-src/Foundation/AppleDisk");
		const {AppleComputer} = require("./node-src/Foundation/AppleComputer");
		const {AppleBaseSystemHub} = require("./node-src/Foundation/AppleBasesystemHub");
		const {AppleBootableHub} = require("./node-src/Foundation/AppleBootableHub");

		const computer = new AppleComputer()

		if (AppleDisk.isExistsDisk(name) && await confirm({ message: "Skip install" })) {

		} else {

		}

		let {
			dataStorageSize,
			operationSystemVersion,
			ram,
			// graphic
		} = await generateWizardData()

		const operationSystemDrive = {
			sonoma: AppleBaseSystemHub.Sonoma,
			ventura: AppleBaseSystemHub.Ventura,
		}[operationSystemVersion]

		const dataVirtualDrive = await AppleDisk
			.of(name)
			.setSize(dataStorageSize)
			.spawnImage(false, true)

		let dvdVenturaInstallerDrive = undefined

		if (operationSystemVersion === 'ventura') {
			dvdVenturaInstallerDrive = AppleDisk.ofDvDIso(
				`${process.cwd()}/prebuilt/InstallAssistant/InstallAssistantVentura.iso`,
				'AppleVenturaIsoDVD'
			)
		}

		logger.debug('Running...')

		computer
			.setRam(ram)
			.setVersionSystem(operationSystemVersion)
			.setDrive(AppleBootableHub.prebuilt)
			.setDrive(operationSystemDrive)
			.setDrive(dvdVenturaInstallerDrive, 5)
			.setDataDrive(dataVirtualDrive.toVirtualDrive(true, "MacHDD")) // should be MacHDD
			.setDisplay('sdl')
			// .useAppleKvm()
			.setEnableGraphic(false)
			.setHypervisorVmxConfig(true, true)
			.setEnableVnc('127.0.0.1', 1)
			.setOvmf(AppleOVMF.ovmfCodeFile)
			.setOvmf(AppleOVMF.ovmfVars1024x768File)

		try {
			computer.spawnAndRunComputer()
		} catch (e) {
			console.error(e)
		}

		// const argv = computer.spawnQemuRunnable().getArgs()
		//
		// const unix = new UnixVirtualization()
		//
		// console.log(computer.spawnQemuRunnable().getArgs(false))
		//
		// console.log(unix.run(argv))
	})

program
	.command("hotspawn-vm <name>")
	.description('Create virtual machine with prebuild data')
	.action(async (name) => {
		const {AppleOVMF} = require("./node-src/Foundation/AppleOVMF");
		const {AppleDisk} = require("./node-src/Foundation/AppleDisk");
		const {AppleComputer} = require("./node-src/Foundation/AppleComputer");
		const {AppleBaseSystemHub} = require("./node-src/Foundation/AppleBasesystemHub");
		const {AppleBootableHub} = require("./node-src/Foundation/AppleBootableHub");

		const computer = new AppleComputer()

		const ram = parseInt(await select({
			message: 'Select the amount of RAM',
			choices: _.range(1024, 1024 * 32, 1024).map(size => ({
				name: `${size} MB`,
				value: size,
				// description: '',
			}))
		}))

		const operationSystemVersion =  await select({
			message: 'Select a operation system',
			choices: [
				{
					name: 'sonoma',
					value: 'sonoma',
					description: 'macOS Sonoma 14.0',
				},
				{
					name: 'ventura',
					value: 'ventura',
					description: 'macOS Ventura 13.0',
				},
			],
		})

		const vncHost =  await select({
			message: 'Select a VNC-host',
			choices: [
				{
					name: 'localhost (127.0.0.1)',
					value: '127.0.0.1',
					description: "VNC is ONLY available on YOUR computer"
				},
				{
					name: 'shared (0.0.0.0)',
					value: '0.0.0.0',
					description: 'VNC is available to EVERYONE who is on the local and global network',
				},
			],
		})

		let prebuiltBootableDiskUri

		const qcowUri = `${process.cwd()}/data/generated/HOTSPAWN_${name}.qcow2`

		if (!fs.existsSync(qcowUri)) {
			if (await confirm({ message: "Generate random MacOS data?", default: true })) {
				const data = Object.assign(AppleBootable.spawnData(), {
					OUTPUT_QCOW: qcowUri,
					MASTER_PLIST: './config-custom.plist'
				})

				logger.debug(JSON.stringify(data, null, 2))

				await AppleBootable.spawnDisk(data)

				prebuiltBootableDiskUri = (new AppleDisk()).useExistDisk(qcowUri).toVirtualDrive(true, "OpenCoreBoot")
			} else {
				prebuiltBootableDiskUri = AppleBootableHub.prebuilt.makeIOSafe()
			}
		} else {
			prebuiltBootableDiskUri = (new AppleDisk()).useExistDisk(qcowUri).toVirtualDrive(true, "OpenCoreBoot")
		}

		const operationSystemDrive = {
			sonoma: AppleBaseSystemHub.Sonoma,
			ventura: AppleBaseSystemHub.Ventura,
		}[operationSystemVersion]

		const disks = fs.readdirSync(`${process.cwd()}/data/hotdata`).map(path => ({
			name: path,
			value: `${process.cwd()}/data/hotdata/${path}`
		}))

		/**
		 * @type {PhantomFile} dataDrive
		 */
		const dataDrive = await select({
			message: 'Select HotData drive',
			choices: disks
		})

		let developerKit = undefined

		if (fs.existsSync(`${process.cwd()}/prebuilt/DeveloperKit.iso`)) {
			const connectDeveloperKit = await confirm({
				message: 'Would you like to connect DeveloperKit to your machine?',
			})

			if (connectDeveloperKit) {
				developerKit = AppleDisk.ofDvDIso(
					`${process.cwd()}/prebuilt/DeveloperKit.iso`,
					'DeveloperKitIso'
				)
			}
		}

		const dataDisk = new AppleDisk()

		let dataDriveReadyUri = `${process.cwd()}/data/hdd/HOTSPAWN_${name}`

		if (await confirm({message: "Do you want to use a ready-made hard disk image file with data in a non-standard location?"})) {
			while (true) {
				const pathToDisk = await input({message: "Path"})

				if (path.isAbsolute(pathToDisk) && fs.existsSync(pathToDisk)) {
					dataDriveReadyUri = path.normalize(pathToDisk)
					break
				} else {
					logger.debug("Disk not found at this path or path is non absolute")
				}
			}
		} else {
			if (!fs.existsSync(dataDriveReadyUri)) {
				logger.debug('We are preparing the files. Please note that HotSwap will require more preparation time than installation of the system itself.')

				copySync(
					String(dataDrive),
					dataDriveReadyUri
				)
			}
		}

		dataDisk.useExistDisk(dataDriveReadyUri)

		logger.debug('Running...')

		computer
			.setRam(ram)
			.setVersionSystem(operationSystemVersion)
			.setDrive(prebuiltBootableDiskUri)
			.setDrive(operationSystemDrive)
			.setDrive(developerKit, 5)
			.setDataDrive(dataDisk.toVirtualDrive(true, "MacHDD")) // should be MacHDD
			.setDisplay('sdl')
			// .useAppleKvm()
			.setEnableGraphic(false)
			.setHypervisorVmxConfig(true, true)
			.setEnableVnc(vncHost, 1)
			.setOvmf(AppleOVMF.ovmfCodeFile)
			.setOvmf(AppleOVMF.ovmfVars1024x768File)

		try {
			computer.spawnAndRunComputer()
		} catch (e) {
			console.error(e)
		}
	})

program.parse();