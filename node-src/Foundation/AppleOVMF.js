const {PhantomFile} = require("../helpers/PhantomFile");
const path = require("node:path");

class AppleOVMF {
	static ovmfCodeFile = new PhantomFile({
		path: path.normalize(process.cwd() + "/OVMF_CODE.fd")
	})

	static ovmfVars1024x768File = new PhantomFile({
		path: path.normalize(process.cwd() + "/OVMF_VARS-1024x768.fd"
	)})
}

module.exports = {AppleOVMF}