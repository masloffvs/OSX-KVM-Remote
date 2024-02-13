const { program } = require('commander');
const { input, confirm } = require('@inquirer/prompts');
const {AppleDisk} = require("./node-src/Foundation/AppleDisk");
const {AppleBaseSystemHub} = require("./node-src/Foundation/AppleBasesystemHub");
const {AppleComputer} = require("./node-src/Foundation/AppleComputer");
const {AppleVirtualDrive} = require("./node-src/Foundation/AppleVirtualDrive");
const {AppleBootableHub} = require("./node-src/Foundation/AppleBootableHub");
const {AppleOVMF} = require("./node-src/Foundation/AppleOVMF");
const {UnixVirtualization} = require("./node-src/Foundation/UnixVirtualization");

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
		console.log(AppleBaseSystemHub)
	})

program
	.command("create-vm <name>")
	.action(async (name) => {
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