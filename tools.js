const {createRandomMacOSHDD} = require("./node-src/utils/serialDisk");

createRandomMacOSHDD("./disk.img").then(console.log).catch(console.error)