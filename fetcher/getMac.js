#!/usr/bin/env node
/*
Gather recovery information for Macs.

Copyright (c) 2019, vit9696

macrecovery is a tool that helps to automate recovery interaction. It can be
used to download diagnostics and recovery as well as analyze MLB.

Requires Node.js to run.
*/

const axios = require('axios');
const fs = require('fs');
const { URL } = require('url');
const {Agent} = require("https");

const SELF_DIR = __dirname;

const RECENT_MAC = 'Mac-7BA5B2D9E42DDD94';
const MLB_ZERO = '00000000000000000';
const MLB_VALID = 'C02749200YGJ803AX';
const MLB_PRODUCT = '00000000000J80300';

const TYPE_SID = 16;
const TYPE_K = 64;
const TYPE_FG = 64;

const INFO_PRODUCT = 'AP';
const INFO_IMAGE_LINK = 'AU';
const INFO_IMAGE_HASH = 'AH';
const INFO_IMAGE_SESS = 'AT';
const INFO_SIGN_LINK = 'CU';
const INFO_SIGN_HASH = 'CH';
const INFO_SIGN_SESS = 'CT';
const INFO_REQURED = [INFO_PRODUCT, INFO_IMAGE_LINK, INFO_IMAGE_HASH, INFO_IMAGE_SESS, INFO_SIGN_LINK, INFO_SIGN_HASH, INFO_SIGN_SESS];

function runQuery(url, headers, postData=null) {
	const httpsAgent = new Agent({
		rejectUnauthorized: false, // (NOTE: this will disable client verification)
	})

	return axios({
		method: postData ? 'post' : 'get',
		url: url,
		headers: headers,
		data: postData,
		httpsAgent
	});
}

function generateId(idType, idValue=null) {
	const validChars = '0123456789ABCDEF';
	let generatedId = '';
	if (!idValue) {
		for (let i = 0; i < idType; i++) {
			generatedId += validChars.charAt(Math.floor(Math.random() * validChars.length));
		}
	} else {
		generatedId = idValue;
	}
	return generatedId;
}

async function downloadFile(url, outputPath) {
	const response = await axios({
		method: 'get',
		url: url,
		responseType: 'stream'
	});

	response.data.pipe(fs.createWriteStream(outputPath));

	return new Promise((resolve, reject) => {
		response.data.on('end', () => {
			resolve(outputPath);
		});

		response.data.on('error', (err) => {
			reject(err);
		});
	});
}

(async () => {
	const idType = TYPE_K;
	const idValue = generateId(idType, MLB_ZERO);
	const plistHeaders = {
		'Accept': '*/*',
		'X-MMe-Client-Info': '<iPhone7,2> <iPhone OS;11.3.1;15E302>',
		'User-Agent': 'AssetCacheLocatorService/1227.5.4 CFNetwork/811.5.4 Darwin/16.7.0 (x86_64)',
		'Accept-Language': 'en-us',
		'Content-Type': 'text/x-apple-plist+xml',
		'X-Apple-AssetKey': `${idType}:${idValue}`,
		'X-Apple-ProtocolVer': '2.0',
		'X-Apple-Tz': '0',
		'X-Apple-ActionSignature': generateId(TYPE_SID),
		'X-Apple-SessionId': generateId(TYPE_FG),
	};

	let response;
	try {
		response = await runQuery('https://gsa.apple.com/grandslam/Gather', plistHeaders);
	} catch (e) {
		console.error(`ERROR: ${e.message}`);
		return;
	}

	const info = response.data[INFO_PRODUCT];
	if (!info) {
		console.error('ERROR: Failed to retrieve product information!');
		return;
	}

	const requiredInfoPresent = INFO_REQURED.every((key) => Object.keys(info).includes(key));
	if (!requiredInfoPresent) {
		console.error('ERROR: Required product information is missing!');
		return;
	}

	const imageLink = info[INFO_IMAGE_LINK];
	const imageHash = info[INFO_IMAGE_HASH];
	const imageSess = info[INFO_IMAGE_SESS];
	const signLink = info[INFO_SIGN_LINK];
	const signHash = info[INFO_SIGN_HASH];
	const signSess = info[INFO_SIGN_SESS];

	if (!imageLink || !imageHash || !imageSess || !signLink || !signHash || !signSess) {
		console.error('ERROR: Required product information is incomplete!');
		return;
	}

	let chunkListPath = `${SELF_DIR}/../Data/${imageHash}.chunklist`;

	let recoveryImagePath;

	try {
		recoveryImagePath = await downloadFile(imageLink, chunkListPath);
	} catch (e) {
		console.error(`ERROR: ${e.message}`);
		return;
	}

	let recoverySignPath;
	try {
		recoverySignPath = await downloadFile(signLink, chunkListPath);
	} catch (e) {
		console.error(`ERROR: ${e.message}`);
		return;
	}

	if (!fs.existsSync(recoverySignPath)) {
		console.error('ERROR: Signature download failed!');
		return;
	}

	console.log('SUCCESS: Recovery information was gathered successfully.');
	console.log(`Image path: ${recoveryImagePath}`);
	console.log(`Sign path: ${recoverySignPath}`);
})();
