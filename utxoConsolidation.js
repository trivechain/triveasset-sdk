const Trivechaincore = require('@trivechain/trivechaincore-lib');
const TriveAssetProtocol = require('@trivechain/triveasset-protocol');
const bitcoin = require('bitcoinjs-lib');
const { utxoConsolidationSchema } = require('./lib/validation');
const { getAddressesUtxo, transmit, uploadMetadata } = require('./lib/helper');

const { Address, Networks, PrivateKey } = Trivechaincore;
const { TransactionBuilder } = TriveAssetProtocol;

const UTXO_LIMIT = 500;

const utxoConsolidation = async (args) => {
	try {
		let params = await utxoConsolidationSchema.validateAsync(args);

		for (let addr of params.from) {
			if (!Address.isValid(addr, Networks[params.network])) {
				throw new Error(`${addr} is not a valid address on ${params.network}`);
			}
		}
		if (!Address.isValid(params.financeChangeAddress, Networks[params.network])) {
			throw new Error(`${params.financeChangeAddress} is not a valid address on ${params.network}`);
		}
		if (!Address.isValid(params.coloredChangeAddress, Networks[params.network])) {
			throw new Error(`Address ${params.coloredChangeAddress} is not valid on ${params.network}`);
		}
		if (params.privateKey) {
			for (let pk of params.privateKey) {
				if (!PrivateKey.isValid(pk, Networks[params.network])) {
					throw new Error(`Private key is not valid on ${params.network}`);
				}
			}
		}

		let skip = 0;
		let loop = true;

		let utxos = null;
		await getAddressesUtxo(params.from, UTXO_LIMIT, skip)
			.then(res => utxos = res)
			.catch(err => { throw new Error(err) })
		console.log('numOfUtxos:', utxos.numOfUtxos);
		utxos = utxos.utxos;

		params.utxos = [];
		let utxosChunk = [];
		let assetValueSat = BigInt(0);
		let valueSat = BigInt(0);
		let tempUtxo = [];
		let trvcNeeded = BigInt(7441);

		// slice the utxos into utxosChunk
		for (let i = utxos.length - 1; i >= 0; i--) {
			if (!utxos[i].isConfirmed) continue;

			utxos[i].value = utxos[i].valueSat;

			// for trvc
			if (utxos[i].assets.length === 0) {
				if (valueSat < trvcNeeded) {
					console.log('no asset')
					valueSat += BigInt(utxos[i].value);
					tempUtxo.push(utxos[i]);
					trvcNeeded += BigInt(1000);
				}
			}

			// for asset
			for (let a of utxos[i].assets) {
				if (a.assetId === params.assetId) {
					valueSat += BigInt(utxos[i].value);
					assetValueSat += BigInt(a.amount);
					tempUtxo.push(utxos[i]);
					trvcNeeded += BigInt(1000);
					break;
				}
			}

			// if finish looping, minimum 50 utxo to consolidate, else, 200 utxo every consolidation
			if (i === 0 && tempUtxo.length >= 2) {
				console.log('last:', tempUtxo.length)
				utxosChunk.push({
					utxos: tempUtxo,
					amount: Number(assetValueSat),
					fee: Number(trvcNeeded - BigInt(5441))
				});

			} else if (tempUtxo.length >= 5) {
				console.log('count:', tempUtxo.length)
				utxosChunk.push({
					utxos: tempUtxo,
					amount: Number(assetValueSat),
					fee: Number(trvcNeeded - BigInt(5441))
				});
				count = 0;
				tempUtxo = [];
				assetValueSat = BigInt(0);
				trvcNeeded = BigInt(7441);
				valueSat = BigInt(0);
			}
		}

		if (utxosChunk.length <= 0) {
			throw new Error('Your number of utxos is less than 50.')
		}

		const tabuilder = new TransactionBuilder({ network: params.network });

		let unsignedTxHexArray = [];
		let signedTxHexArray = [];
		let txid = [];

		console.log('utxosChunk length:', utxosChunk.length)

		// start build send asset
		for (let chunk of utxosChunk) {
			params.to = [{
				address: params.coloredChangeAddress,
				amount: chunk.amount,
				assetId: params.assetId,
			}]

			params.utxos = chunk.utxos

			params.fee = chunk.fee;

			console.log(params.utxos.length, params.fee)
			//don't have to upload ipfs everytime since it is the same metadata
			if (params.metadata && !params.ipfsHash) {
				await uploadMetadata(params)
					.then(res => { params = res })
					.catch(err => { throw new Error(err) });
			}

			const txBuilt = await tabuilder.buildSendTransaction(params);

			//return unsigned tx hex
			if (!params.privateKey) {
				// console.log(txBuilt.txHex);
				unsignedTxHexArray.push(txBuilt.txHex);
				continue;
			}

			let txb = txBuilt.txb;

			for (let priv of params.privateKey) {
				const privateKey = new bitcoin.ECPair.fromWIF(priv, txb.network);
				for (var i = 0; i < txb.tx.ins.length; i++) {
					if (new Trivechaincore.Script.fromAddress(privateKey.getAddress()).toHex() == Buffer.from(txb.inputs[i].prevOutScript).toString('hex')) {
						txb.inputs[i].scriptType = null;
						txb.sign(i, privateKey);
					}
				}
			}

			tx = txb.build();

			const signedTxHex = tx.toHex();

			//return signed tx hex
			if (!params.transmit) {
				// console.log(signedTxHex)
				signedTxHexArray.push(signedTxHex);
				continue;
			}

			let transmitResp = null;
			await transmit(signedTxHex)
				.then(res => transmitResp = res)
				.catch(err => transmitResp = err);


			if (transmitResp && transmitResp.txid) {
				txid.push(transmitResp.txid);
				return txid
			} else {

				if (txid.length > 0) {
					return { txid, m: 'Some transaction failed to broadcast' }
				} else {
					throw new Error(transmitResp);
				}
			}
		}


		if (txid.length) {
			return { txid }
		}

		if (signedTxHexArray.length) {
			return { signedTxHex: signedTxHexArray }
		}

		return { unsignedTxHex: unsignedTxHexArray }

	} catch (err) {
		console.log('--CATCH--')
		console.error(err)
		return err;
	}
}

module.exports = utxoConsolidation;