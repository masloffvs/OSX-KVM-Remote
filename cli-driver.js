const { program } = require('commander');
const { input, confirm } = require('@inquirer/prompts');
const {AppleBootable} = require("./node-src/Foundation/AppleBootable");
const {logger} = require("./node-src/logger");
const fs = require("node:fs");

program
	.option("--size <size>", "Size of disk")
	.option("--force")
	.command("create-disk <name>")
	.action(async (name) => {
		const opts = program.opts()

		const disk =
			await AppleDisk
				.of(name)
				.spawnImage(opts.force)

		console.log(disk.dump())
	})

program
	.command("prebuilt-disks")
	.action(async (name) => {
		// console.log(AppleBaseSystemHub)
	})

program
	.command("spawn-random-bootable-data")
	.action(async () => {
		const {AppleBootable} = require("./node-src/Foundation/AppleBootable");

		console.log(AppleBootable.spawnData())
	})

program
	.command("spawn-random-bootable-disk <name>")
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
	.command("create-vm <name>")
	.action(async (name) => {
		const {AppleOVMF} = require("./node-src/Foundation/AppleOVMF");
		const {UnixVirtualization} = require("./node-src/Foundation/UnixVirtualization");
		const {AppleDisk} = require("./node-src/Foundation/AppleDisk");
		const {AppleComputer} = require("./node-src/Foundation/AppleComputer");
		const {AppleBaseSystemHub} = require("./node-src/Foundation/AppleBasesystemHub");
		const {AppleBootableHub} = require("./node-src/Foundation/AppleBootableHub");

		const computer = new AppleComputer()

		const dataVirtualDrive = await AppleDisk.of(name).spawnImage(true)

		computer
			.setDrive(AppleBootableHub.prebuilt)
			.setDrive(AppleBaseSystemHub.Sonoma)

			.setDataDrive(dataVirtualDrive.toVirtualDrive(true, "MacHDD"))

			.setDisplay('sdl')
			.setEnableGraphic(false)
			.setEnableVnc('127.0.0.1', 1)

			.setOvmf(AppleOVMF.ovmfCodeFile)
			.setOvmf(AppleOVMF.ovmfVars1024x768File)

		const argv = computer.spawnQemuRunnable().getArgs()

		const unix = new UnixVirtualization()

		console.log(computer.spawnQemuRunnable().getArgs(false))

		console.log(unix.run(argv))
	})

program.parse();