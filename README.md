# OSX-KVM-Remote

<img src="https://i.ibb.co/kQgsdYH/Background-1.png" align="right"
alt="Size Limit logo by Anton Lovchikov" width="80" height="80">

**OSX-KVM-Remote** is a project aimed at creating a Virtual Hackintosh system for educational tasks, software builds, testing, kernel debugging, reversing, and macOS security research. It allows you to run macOS within a virtual machine on a modern Linux distribution, providing a reproducible and open-source alternative to Apple's closed ecosystem.

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![JavaScript](https://img.shields.io/badge/javascript-3670A0?style=for-the-badge&logo=javascript&logoColor=white)

<br/>

# Why? For What?

The **OSX-KVM-Remote** project serves the purpose of enabling the creation of a Virtual Hackintosh system. This system can be used for various tasks and objectives, including:

- Educational purposes: Learning about macOS, its internals, and its compatibility with different hardware configurations.
- Software development: Building and testing macOS applications and software.
- Kernel debugging: Debugging macOS kernel issues.
- Reversing: Analyzing and reversing macOS binaries.
- macOS security research: Studying the security aspects of macOS in a controlled environment.


# Requirements

Before getting started with the **OSX-KVM-Remote** project, you need to ensure that you meet the following requirements:

- A modern Linux distribution, such as Ubuntu 22.04 LTS 64-bit or later.
- QEMU version 6.2.0 or higher.
- A CPU with Intel VT-x or AMD SVM support (you can check this with `grep -e vmx -e svm /proc/cpuinfo`).
- SSE4.1 support for macOS Sierra or later.
- AVX2 support for macOS Mojave or later.

_**Note**: Older AMD CPUs may have compatibility issues, but modern AMD Ryzen processors are known to work well._

### Installation
```shell
bash -c "$(curl -fsSL https://raw.githubusercontent.com/masloffvs/OSX-KVM-Remote/main/get.sh)"
```

### Usage
##### First step. Export HOST-name for requests

```bash
export HOST='localhost:3000'
```


##### Create VM
```bash
# Create new VM and run it

# name: only english chars
# version: ['sonoma']
curl -X POST http://$HOST/api/vms/create -d '{
  "name": "myVmName",
  "version": "sonoma"
}'
```

##### Stop exist VM
```bash
# Stop VM

# myVmName = yor vm name
curl -X POST http://$HOST/api/vms/myVmName/stop
```

##### Start exist VM after stop it
```bash
# Run VM when VM stopped

# myVmName = yor vm name
curl -X POST http://$HOST/api/vms/myVmName/start
```

##### Get all exists VM (not snapshots!)
```bash
# Get all VM

curl -X POST http://$HOST/api/vms/list
```

##### Get all exists disks
```bash
# Get all disks list

curl -X POST http://$HOST/api/resources/disks/list
```

##### Get all snapshots
```bash
# Get all snapshots list

curl -X POST http://$HOST/api/resources/snapshots/list
```
(you can run it via '/api/vms/***/start')


### Credits and Authors

**1. Main Author:**

* [OSX-KVM by kholia](https://github.com/kholia/OSX-KVM)
  This project stands on the shoulders of the main author and initiator, without whom many of these efforts would have been impossible.


**2. Authors and References:**

* [macOS-Simple-KVM by foxlet](https://github.com/foxlet/macOS-Simple-KVM)
  Thanks for the inspiration and contributions that have contributed to this project.

* [Docker-OSX by sickcodes](https://github.com/sickcodes/Docker-OSX)
  Thanks for the containerization ideas and some of the scripts that have contributed to the development of this project.

* [osx-serial-generator by sickcodes](https://github.com/sickcodes/osx-serial-generator)
  Thanks for the utility that provides pre-generated serial numbers and other deterministic parameters for creating virtual hard disks.

### Post-Installation

* See [networking notes](networking-qemu-kvm-howto.txt) on how to setup networking in your VM, outbound and also inbound for remote access to your VM via SSH, VNC, etc.
* To passthrough GPUs and other devices, see [these notes](notes.md#gpu-passthrough-notes).
* Need a different resolution? Check out the [notes](notes.md#change-resolution-in-opencore) included in this repository.
* Trouble with iMessage? Check out the [notes](notes.md#trouble-with-imessage) included in this repository.
* Highly recommended macOS tweaks - https://github.com/sickcodes/osx-optimizer


### Is This Legal?

The "secret" Apple OSK string is widely available on the Internet. It is also included in a public court document [available here](http://www.rcfp.org/sites/default/files/docs/20120105_202426_apple_sealing.pdf). I am not a lawyer but it seems that Apple's attempt(s) to get the OSK string treated as a trade secret did not work out. Due to these reasons, the OSK string is freely included in this repository.

Please review the ['Legality of Hackintoshing' documentation bits from Dortania's OpenCore Install Guide](https://dortania.github.io/OpenCore-Install-Guide/why-oc.html#legality-of-hackintoshing).

Gabriel Somlo also has [some thoughts](http://www.contrib.andrew.cmu.edu/~somlo/OSXKVM/) on the legal aspects involved in running macOS under QEMU/KVM.

You may also find [this 'Announcing Amazon EC2 Mac instances for macOS' article](https://aws.amazon.com/about-aws/whats-new/2020/11/announcing-amazon-ec2-mac-instances-for-macos/
) interesting.

Note: It is your responsibility to understand, and accept (or not accept) the
Apple EULA.

Note: This is not legal advice, so please make the proper assessments yourself
and discuss with your lawyers if you have any concerns (Text credit: Dortania)


### What motivated kholia

My aim is to enable macOS based educational tasks, builds + testing, kernel
debugging, reversing, and macOS security research in an easy, reproducible
manner without getting 'invested' in Apple's closed ecosystem (too heavily).

These `Virtual Hackintosh` systems are not intended to replace the genuine
physical macOS systems.

Personally speaking, this repository has been a way for me to 'exit' the Apple
ecosystem. It has helped me to test and compare the interoperability of `Canon
CanoScan LiDE 120` scanner, and `Brother HL-2250DN` laser printer. And these
devices now work decently enough on modern versions of Ubuntu (Yay for free
software). Also, a long time back, I had to completely wipe my (then) brand new
`MacBook Pro (Retina, 15-inch, Late 2013)` and install Xubuntu on it - as the
`OS X` kernel kept crashing on it!

Backstory: I was a (poor) student in Canada in a previous life and Apple made [my work on cracking Apple Keychains](https://github.com/openwall/john/blob/bleeding-jumbo/src/keychain_fmt_plug.c) a lot harder than it needed to be. This is how I got interested in Hackintosh systems.
