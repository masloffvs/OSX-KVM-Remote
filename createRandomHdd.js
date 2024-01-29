const {createRandomMacOSHDD} = require("./node-src/utils/serialDisk");

createRandomMacOSHDD('./hdd.img').then(console.log)