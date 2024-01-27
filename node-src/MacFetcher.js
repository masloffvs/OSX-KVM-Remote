const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

const SELF_DIR = __dirname;
const RECENT_MAC = 'Mac-7BA5B2D9E42DDD94';
const MLB_ZERO = '00000000000000000';
const MLB_VALID = 'C02749200YGJ803AX';
const MLB_PRODUCT = '00000000000J80300';

const INFO_PRODUCT = 'AP';
const INFO_IMAGE_LINK = 'AU';
const INFO_IMAGE_HASH = 'AH';
const INFO_IMAGE_SESS = 'AT';
const INFO_SIGN_LINK = 'CU';
const INFO_SIGN_HASH = 'CH';
const INFO_SIGN_SESS = 'CT';

function generateID(idType, idValue = null) {
	const validChars = '0123456789ABCDEF';
	return idValue || Array.from({ length: idType }, () => validChars[Math.floor(Math.random() * 16)]).join('');
}

function productMLB(mlb) {
	return `00000000000${mlb[11]}${mlb[12]}${mlb[13]}${mlb[14]}00`;
}

function mlbFromEEEE(eeee) {
	if (eeee.length !== 4) {
		throw new Error('Invalid EEEE code length!');
	}
	return `00000000000${eeee}00`;
}

function intFromUnsignedBytes(byteList, byteOrder) {
	if (byteOrder === 'little') {
		byteList = byteList.reverse();
	}
	const encoded = Buffer.from(byteList).toString('hex');
	return parseInt(encoded, 16);
}

const Apple_EFI_ROM_public_key_1 = 0xC3E748CAD9CD384329E10E25A91E43E1A762FF529ADE578C935BDDF9B13F2179D4855E6FC89E9E29CA12517D17DFA1EDCE0BEBF0EA7B461FFE61D94E2BDF72C196F89ACD3536B644064014DAE25A15DB6BB0852ECBD120916318D1CCDEA3C84C92ED743FC176D0BACA920D3FCF3158AFF731F88CE0623182A8ED67E650515F75745909F07D415F55FC15A35654D118C55A462D37A3ACDA08612F3F3F6571761EFCCBCC299AEE99B3A4FD6212CCFFF5EF37A2C334E871191F7E1C31960E010A54E86FA3F62E6D6905E1CD57732410A3EB0C6B4DEFDABE9F59BF1618758C751CD56CEF851D1C0EAA1C558E37AC108DA9089863D20E2E7E4BF475EC66FE6B3EFDCF;

class ChunkListHeader {
	constructor(data) {
		this.magic = data.slice(0, 4).toString('utf8');
		this.headerSize = data.readUInt32LE(4);
		this.fileVersion = data.readUInt8(8);
		this.chunkMethod = data.readUInt8(9);
		this.signatureMethod = data.readUInt8(10);
		this.chunkCount = data.readUInt8(11);
		this.chunkOffset = data.readUIntLE(12, 3);
		this.signatureOffset = data.readUIntLE(15, 3);
	}
}

class Chunk {
	constructor(data) {
		this.chunkSize = data.readUInt32LE(0);
		this.chunkSHA256 = data.slice(4, 36);
	}
}

function verifyChunklist(cnkpath) {
	const data = fs.readFileSync(cnkpath);
	const hashCtx = crypto.createHash('sha256');
	const header = new ChunkListHeader(data);
	hashCtx.update(data);

	if (header.magic !== 'CNKL') {
		throw new Error('Invalid magic number in chunklist');
	}

	const chunks = [];
	let offset = header.chunkOffset;
	for (let i = 0; i < header.chunkCount; i++) {
		const chunkData = data.slice(offset, offset + 36);
		const chunk = new Chunk(chunkData);
		chunks.push(chunk);
		offset += chunk.chunkSize;
		hashCtx.update(chunkData);
	}

	const digest = hashCtx.digest();
	if (header.signatureMethod === 1) {
		const signatureData = data.slice(header.signatureOffset, header.signatureOffset + 256);
		const signature = intFromUnsignedBytes(signatureData, 'little');
		const plaintext = 0x1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff003031300d0609608648016503040201050004200000000000000000000000000000000000000000000000000000000000000000 | intFromUnsignedBytes(digest, 'big');
		if (Math.pow(signature, 0x10001, Apple_EFI_ROM_public_key_1) !== plaintext) {
			throw new Error('Invalid chunklist signature');
		}
	} else {
		throw new Error('Unsupported signature method');
	}

	return chunks;
}

function downloadFile(url, path) {
	return axios.get(url, { responseType: 'arraybuffer' })
		.then(response => {
			fs.writeFileSync(path, response.data);
			return path;
		})
		.catch(error => {
			throw new Error(`Failed to download file: ${error.message}`);
		});
}

async function main() {
	const mac = RECENT_MAC;
	const deviceModel = 'Mac-' + generateID(12);
	const eeee = 'C027';
	const mlb = 'C02749200YGJ803AX';
	const smbiosSerial = 'C02B' + generateID(8);
	const gencnfg = '0000';
	const efiVersion = '0000000000000000';

	const imageLink = `https://mesu.apple.com/assets/${INFO_PRODUCT}/${INFO_IMAGE_LINK}/${mac}/${mac}/${deviceModel}/${mlb}/${smbiosSerial}/${gencnfg}/${mlbFromEEEE(eeee)}/${mlb}/${mac}/${mlb}/${mlb}/${efiVersion}/${mlb}/${INFO_PRODUCT}/00000000/00000000/${mlbFromEEEE(eeee)}/00000000/${mac}/${mlb}/${INFO_IMAGE_LINK}`;

	const signLink = `https://mesu.apple.com/assets/${INFO_PRODUCT}/${INFO_SIGN_LINK}/${mac}/${mac}/${deviceModel}/${mlb}/${smbiosSerial}/${gencnfg}/${mlbFromEEEE(eeee)}/${mlb}/${mac}/${mlb}/${mlb}/${efiVersion}/${mlb}/${INFO_PRODUCT}/00000000/00000000/${mlbFromEEEE(eeee)}/00000000/${mac}/${mlb}/${INFO_SIGN_LINK}`;

	const imageHash = await downloadFile(imageLink, `${SELF_DIR}/${mac}_${INFO_IMAGE_HASH}`);
	const signHash = await downloadFile(signLink, `${SELF_DIR}/${mac}_${INFO_SIGN_HASH}`);

	const chunks = verifyChunklist(imageHash);

	for (const chunk of chunks) {
		console.log(chunk.chunkSize, chunk.chunkSHA256.toString('hex'));
	}
}

main().catch(error => {
	console.error(error.message);
	process.exit(1);
});
