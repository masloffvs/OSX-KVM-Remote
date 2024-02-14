const {readFileSync} = require("node:fs");

const config = JSON.parse(String(readFileSync(process.cwd() + "/hypervisor.json")))
const app = JSON.parse(String(readFileSync(process.cwd() + "/app.json")))

module.exports = { config, app }