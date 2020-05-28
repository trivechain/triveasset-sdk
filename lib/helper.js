const fetch = require('node-fetch');
const properties = require('./properties');
const MetadataServer = require('./metadata_server');

exports.getAddressesUtxo = (addresses) => {
	return new Promise(async (resolve, reject) => {
		fetch(`${properties.trivechainApi}/utxos/address`, {
			method: 'post',
			body: JSON.stringify({ addresses }),
			headers: { 'Content-Type': 'application/json' },
		})
			.then(res => res.json())
			.then(json => { return resolve(json) })
			.catch(err => { return reject(err) })
	});
}

exports.getUtxosDetail = (utxos) => {
	return new Promise(async (resolve, reject) => {
		fetch(`${properties.trivechainApi}/utxos`, {
			method: 'post',
			body: JSON.stringify({ utxos }),
			headers: { 'Content-Type': 'application/json' },
		})
			.then(res => res.json())
			.then(json => { return resolve(json) })
			.catch(err => { return reject(err) })
	});
}

exports.transmit = (txHex) => {
	return new Promise(async (resolve, reject) => {
		fetch(`${properties.trivechainApi}/rpc/transmit`, {
			method: 'post',
			body: JSON.stringify({ txHex }),
			headers: { 'Content-Type': 'application/json' },
		})
			.then(res => res.json())
			.then(json => { return resolve(json) })
			.catch(err => { return reject(err) })
	});
}

exports.sleep = (milliseconds) => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

exports.uploadMetadata = (params) => {
	return new Promise((resolve, reject) => {
		const metadataServer = new MetadataServer();
		metadataServer.upload(params, function (err, newParams) {
			if (err) return reject(err);

			return resolve(newParams)
		})
	})
}