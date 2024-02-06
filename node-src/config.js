const {readFileSync} = require("node:fs");

const config = JSON.parse(String(readFileSync(process.cwd() + "/hypervisor.json")))

module.exports = {config}