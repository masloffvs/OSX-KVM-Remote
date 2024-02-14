const {Throwable} = require("../Throwable");
const _ = require("lodash");
const {existsSync} = require("node:fs")
const {PhantomFile} = require("../helpers/PhantomFile");

class AppleVirtualDrive {
	_name = ''
	_type = 'qcow2'
	_size = ''
	_src = ''
	_label = ''
	_if_ = null
	_snapshot = 'off'
	_media = null
	_exist = null

	CACHE_QEMU_ARGS = null

	_q() {
		let args = [
			this._label ? `id=${this._label}` : null,
			`file=${this._src}`,
			this._media ? `media=disk` : null,
			`format=${this._type}`,
			// `cache=writeback`,
			this._size ? `size=${this._size}` : null,
			this._if_ ? `if=${this._if_}` : null,
			this._snapshot ? `snapshot=${this._snapshot}` : null,
		]
		return [`-drive`, `${args.filter(i => i).join(",")}`.trim()]
	}

	static createOfLink(src, name, size, type, label, options) {
		this.of(src, name, size, type, label, options)
	}

	static of(src, name, size, type, label, options) {
		if (options.if_ && !['ide', 'scsi', 'virtio', 'none'].includes(options.if_)) {
			throw new Throwable(
				"Invalid virtual drive interface specified. Supported interfaces are: ide, scsi, virtio, none.",
				AppleVirtualDrive,
				{
					classdump: this,
					namespace: "AppleVirtualDrive"
				}
			)
		}

		if (options._snapshot && !['on', 'off'].includes(options._snapshot)) {
			throw new Throwable(
				"Invalid virtual drive snapshot specified. Supported snapshot value are: on/off",
				AppleVirtualDrive,
				{
					classdump: this,
					namespace: "AppleVirtualDrive"
				}
			)
		}

		if (!['qcow2', 'raw'].includes(type)) {
			throw new Throwable(
				"Invalid virtual drive format specified. Supported formats are: qcow2, raw.",
				AppleVirtualDrive,
				{
					classdump: this,
					namespace: "AppleVirtualDrive"
				}
			)
		}

		return new AppleVirtualDrive({
			size,
			name,
			type,
			src,
			label,
			...options
		})
	}

	makeIOSafe() {
		const phantomSrc = new PhantomFile({
			path: this._src
		})

		this._src = phantomSrc.createPhantomFile("DISK_IO_SAFE" + this._name)

		return this
	}

	constructor(params) {
		const { src, name, size, type, label, options } = params

		this._size = size
		this._name = name
		this._type = type
		this._src = src
		this._label = label
		this._media = _.get(options, '_media', null)
		this._snapshot = _.get(options, '_snapshot', 'off')
		this._if_ = _.get(options, '_if', 'none')
		this._exist = existsSync(this._src)
		this.CACHE_QEMU_ARGS = this._q()
	}
}

module.exports = {AppleVirtualDrive}