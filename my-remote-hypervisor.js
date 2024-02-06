const rp = require('request-promise');
const Table = require('cli-table3');
const { program } = require('commander');
const dotenv = require("dotenv");
const {logger} = require("./node-src/logger");

dotenv.config();

// Define a class for the remote hypervisor
class MyRemoteHypervisor {
	constructor(host) {
		this.host = host; // Store the host URL in an instance variable
	}

	// Method to fetch VM data from the remote hypervisor
	async fetchCreateVM(name, version) {
		const vmUrl = `${this.host}/api/vms/create`;

		const vmRequestOptions = {
			method: 'POST',
			uri: vmUrl,
			body: {
				name,
				version
			},
			json: true
		};

		try {
			const vmData = await rp(vmRequestOptions);

			return vmData;
		} catch (error) {
			throw new Error(`Error fetching VM data: ${error.message}`);
		}
	}

	// Method to fetch VM data from the remote hypervisor
	async fetchVMData() {
		const vmUrl = `${this.host}/api/vms/list`;

		const vmRequestOptions = {
			uri: vmUrl,
			json: true,
		};

		try {
			const vmData = await rp(vmRequestOptions);

			if (!Array.isArray(vmData)) {
				throw new Error('Invalid data format received from the VMs API.');
			}

			return vmData;
		} catch (error) {
			throw new Error(`Error fetching VM data: ${error.message}`);
		}
	}

	// Method to fetch snapshots data from the remote hypervisor
	async fetchSnapshotsData() {
		const snapshotsUrl = `${this.host}/api/resources/snapshots/list`;

		const snapshotsRequestOptions = {
			uri: snapshotsUrl,
			json: true,
		};

		try {
			const snapshotsData = await rp(snapshotsRequestOptions);

			if (!Array.isArray(snapshotsData)) {
				throw new Error('Invalid data format received from the Snapshots API.');
			}

			return snapshotsData;
		} catch (error) {
			throw new Error(`Error fetching snapshots data: ${error.message}`);
		}
	}

	// Method to display VM data in a table
	async createVM(name, version) {
		logger.info(`creating '${name}' based on ${version}`)
		try {
			const vmData = await this.fetchCreateVM(name, version);

			// Display the table
			console.log('VMs:');
			console.log(vmData);
		} catch (error) {
			console.error('Error displaying VMs:', error.message);
		}
	}

	// Method to display VM data in a table
	async displayVMs() {
		try {
			const vmData = await this.fetchVMData();

			// Create a table to display the VM data
			const table = new Table({
				head: ['Name', 'CPU Cores', 'RAM (MB)', 'Storage (GB)'],
				colWidths: [20, 10, 10, 15],
			});

			// Populate the table with VM information
			vmData.forEach((vm) => {
				const { name, vm: { runnable: { cpuCores, cpuThreads }, proc: { options: { allocatedRam } }, storageDevices } } = vm;
				const storageSizeGB = Array.isArray(storageDevices) ? storageDevices.reduce((acc, device) => acc + (device.size / (1024 * 1024 * 1024)), 0).toFixed(2) : 'N/A';

				table.push([name, cpuCores, allocatedRam, storageSizeGB]);
			});

			// Display the table
			console.log('VMs:');
			console.log(table.toString());
		} catch (error) {
			console.error('Error displaying VMs:', error.message);
		}
	}

	// Method to display snapshots data in a table
	async displaySnapshots() {
		try {
			// Fetch snapshots data using the fetchSnapshotsData method
			const snapshotsData = await this.fetchSnapshotsData();

			// Create a table to display the snapshots data
			const table = new Table({
				head: ['VM Name', 'MAC Model', 'MAC', 'VNC', 'SERIAL'],
				colWidths: [20, 20, 15, 20, 15, 20],
			});

			console.log(JSON.stringify(snapshotsData, null, 2))

			// Populate the table with VMs information
			snapshotsData.forEach((vm) => {
				const { name, data } = vm;
				const optionsOfUniqMacHDD = data.optionsOfUniqMacHDD.finalOptions

				table.push([
					data.name,
					optionsOfUniqMacHDD.DEVICE_MODEL,
					optionsOfUniqMacHDD.MAC_ADDRESS,
					data.vncArgs.port ? ("MACHINE:" + data.vncArgs.port): "",
					optionsOfUniqMacHDD.SERIAL || ''
				]);
			});

			// Display the table
			console.log('VMs:');
			console.log(table.toString());
		} catch (error) {
			console.error('Error displaying snapshots:', error.message);
		}
	}
}

const directLink = process.env.DIRECT_LINK;
const host = process.env.HOST;
const port = process.env.PORT;

const remoteHost = directLink || (host && port ? `http://${host}:${port}` : '');

const hypervisor = new MyRemoteHypervisor(remoteHost);

program.version('1.0.0');

program
	.command('create <name> <version>')
	.description('Create VM')
	.action((name, version) => {

		hypervisor.createVM(name, version);
	});


// Define the Hyper.VMS command
program
	.command('vms')
	.description('List virtual machines')
	.action(() => {
		// Display VMs
		hypervisor.displayVMs();
	});

// Define the Hyper.Snapshots command
program
	.command('snapshots')
	.description('List snapshots')
	.action(() => {
		// Display snapshots
		hypervisor.displaySnapshots();
	});

program.parse(process.argv);
