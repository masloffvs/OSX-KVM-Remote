# AppleComputer

<img src="https://i.ibb.co/kQgsdYH/Background-1.png" align="right" width="80" height="80">

**AppleComputer** is a project aimed at creating a Virtual Hackintosh system for educational tasks, software builds, testing, kernel debugging, reversing, and macOS security research. It allows you to run macOS within a virtual machine on a modern Linux distribution, providing a reproducible and open-source alternative to Apple's closed ecosystem.

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![JavaScript](https://img.shields.io/badge/javascript-yellow?style=for-the-badge&logo=javascript&logoColor=white)
![Bash](https://img.shields.io/badge/bash-black?style=for-the-badge&logo=zsh&logoColor=white)

### DISCLAIMER
<small>
  1. <b>THIS INFORMATION/RESEARCH HAS BEEN SHARED PURELY FOR EXPERIMENTAL AND RESEARCH PURPOSES. IT IS IN NO WAY MEANT TO PROMOTE THE CIRCUMVENTION OF ANYTHING THAT BELONGS TO AND/OR ANYTHING THAT IS THE CREATION/PRIVATE PROPERTY OF ANY CORPORATE ENTITY. THE INFORMATION THAT IS DOCUMENTED AND TRANSCRIBED HERE IS PURELY FOR EDUCATIONAL PURPOSES, AND PROOF OF CONCEPT. SHOULD YOU (OR ANYONE ELSE) CHOOSE TO UTILIZE THE INFORMATION THAT YOU'VE OBTAINED FROM THIS REPOSITORY AND THAT IS WRITTEN HERE IN ANY WAY, KNOW THAT THIS DISCLAIMER SERVES AS A LEGAL PROTECTION TO US AS THE CODE REPOSITORY CREATORS/MAINTAINERS, AND THAT WE ABSOLVE OURSELVES AS SUCH FROM ANY AND ALL RESPONSIBILITIES OR SITUATIONS THAT MIGHT ARISE FROM YOUR CHOOSING TO HAVE UTILIZED ANYTHING DISCUSSED IN THIS CODE REPOSITORY (LEGAL OR OTHERWISE).</b>
  <br/>
  <br/>
  2. <b>IF YOU WISH TO USE THIS SOLUTION IN YOUR OWN BUSINESS, PLEASE CONSULT WITH YOUR LAWYERS REGARDING POSSIBLE RISKS. THE APPLECOMPUTER REPOSITORY AND THE USER MASLOFF IN PARTICULAR ARE NOT RESPONSIBLE FOR USING THE PRODUCT FOR COMMERCIAL PURPOSES, BUT ONLY PROVIDE A CONCEPT FOR UPDATING WORK WITH OPENCORE AND OSX IN QEMU</b>
</small>

### Installation
Installation of the **AppleComputer** system (ex OSX-KVM-Remote) occurs in 1 simple step. Using CURL you can download the installer in one step

```shell
curl -fsSL https://rb.gy/kjmfry | bash
```

[//]: # (### Run)

[//]: # (```shell)

[//]: # (node cli-driver.js help)

[//]: # (# for run server)

[//]: # (sh run-server.sh)

[//]: # (```)

<hr/>

[//]: # (### Usage)

[//]: # (##### First step. Export HOST-name for requests)

[//]: # ()
[//]: # (```bash)

[//]: # (export HOST='localhost:3000')

[//]: # (```)

### Ready-made solutions

#### CLI Driver
If you only need MacOS computers created and managed on your local machine, use the ready-made standard CLI driver - `cli-driver.js`. It comes with the system
```shell
node cli-driver.js --help
```

### SDK
AppleComputer uses JavaScript and NodeJS to work with emulators, prepare images, and control them. To build your basic computer, you just need to write the following code

```javascript
const computer = new AppleComputer()

const dataVirtualDrive = await AppleDisk
  .of("drive-name")
  .setSize(256) // in GB
  .spawnImage(false, true)

computer
  .setRam(4 * 1024) // in GB
  .setVersionSystem('sonoma') // 
  .setDrive(AppleBootableHub.prebuilt) // use prebuild OpenCore system
  .setDrive(AppleBaseSystemHub.Sonoma) 
  // .setDrive(developerKit, 5) // if you need DeveloperKit, see below
  .setDataDrive(dataDisk.toVirtualDrive(true, "MacHDD")) // should be MacHDD
  // .setDisplay('sdl')
  // .useAppleKvm()
  .setEnableGraphic(false) // false=vnc, true=native graphic window
  .setHypervisorVmxConfig(true, true)
  .setEnableVnc('127.0.0.1', 1) // Set VNC
  .setOvmf(AppleOVMF.ovmfCodeFile)
  .setOvmf(AppleOVMF.ovmfVars1024x768File)

computer.spawnAndRunComputer() // Boom! Success!
```

### Development
You can use MacOS manufactured in this ecosystem for development.
To speed up your process before the first start, here are a number of pre-made commands for installing the necessary components manually on a finished Mac

#### Install Cocoapods
Installing cocoapods on the system using Brew (we do not recommend using gem, there is a chance to waste a lot of time, and brew will install everything on its own, including xcode command line tools)
```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install cocoapods
pod setup
pod --version
```

##### Use Cocoapods in exist project
Using Cocoapods in an existing project is very simple. First disintegrate and then install all dependencies using 2 commands
```shell
# cd project
pod deintegrate
pod install
```


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

### Motivation
You can read the motivation of the author of OSX-KVM in the original repository.

On my own behalf I would like to add the following words. My motivation for working with this project is to make MacOS more accessible to researchers, scientists, and developers. With all this, I do not prohibit users of the framework from using this solution for commercial purposes (unless you get your ass kicked by Apple and the contractors of this repository :)).

My goal is to make AppleComputer the home for all the products that currently exist for Hackintosh. Make them accessible, easy to install and use, and versatile
