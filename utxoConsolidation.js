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

		const tabuilder = new TransactionBuilder({ network: params.network });

		let unsignedTxHexArray = [];
		let signedTxHexArray = [];
		let txid = [];

		let assetValueSat = BigInt(0);
		let utxoToSend = [];
		let fee = BigInt(3000);
		let build = false;
		params.utxos = [];

		let skip = 0;
		let loopApi = true;

		while (loopApi) {
			let utxos = null;
			await getAddressesUtxo(params.from, UTXO_LIMIT, skip, params.assetId)
				.then(res => utxos = res)
				.catch(err => { throw new Error(err) });
			console.log('numOfUtxos:', utxos.numOfUtxos);

			utxos = utxos.utxos;

			// // if too less utxos
			// if (utxos.length < 50) {
			// 	throw new Error(`The minimum bumber of utxos consolidation is 50 while the addresses only have ${utxos.length} utxos.`)
			// }

			// check if this is the last loop
			if (utxos.length < UTXO_LIMIT) {
				loop = false;
			} else {
				skip += UTXO_LIMIT;
			}

			for (let i = utxos.length - 1; i >= 0; i--) {
				if (!utxos[i].isConfirmed) continue;

				// for asset
				for (let a of utxos[i].assets) {
					if (a.assetId === params.assetId) {
						assetValueSat += BigInt(a.amount);
						utxos[i].value = utxos[i].valueSat;
						utxoToSend.push(utxos[i]);
						fee += BigInt(1000);
						break;
					}
				}

				// if number of utxos reach maximum || this is the last utxo ever from the address and has more than 50 utxo
				if (utxoToSend.length >= 250 || (i === 0 && utxoToSend >= 50 && !loopApi)) build = true;

				if (!build) continue;

				params.to = [{
					address: params.coloredChangeAddress,
					amount: Number(assetValueSat),
					assetId: params.assetId,
				}];
				params.utxos = utxoToSend;
				params.fee = Number(fee);

				// re-declare into initial value for next for loop
				utxoToSend = [];
				assetValueSat = BigInt(0);
				fee = BigInt(3000);
				build = false;

				//don't have to upload ipfs everytime since it is the same metadata
				if (params.metadata && !params.ipfsHash) {
					await uploadMetadata(params)
						.then(res => { params = res })
						.catch(err => { throw new Error(err) });
				}

				const txBuilt = await tabuilder.buildSendTransaction(params);

				//return unsigned tx hex
				if (!params.privateKey) {
					unsignedTxHexArray.push(txBuilt.txHex);
					continue;
				}

				let txb = txBuilt.txb;

				for (let priv of params.privateKey) {
					const privateKey = new bitcoin.ECPair.fromWIF(priv, txb.network);
					for (var j = 0; j < txb.tx.ins.length; j++) {
						if (new Trivechaincore.Script.fromAddress(privateKey.getAddress()).toHex() == Buffer.from(txb.inputs[j].prevOutScript).toString('hex')) {
							txb.inputs[j].scriptType = null;
							txb.sign(j, privateKey);
						}
					}
				}

				tx = txb.build();

				const signedTxHex = tx.toHex();

				//return signed tx hex
				if (!params.transmit) {
					signedTxHexArray.push(signedTxHex);
					continue;
				}

				let transmitResp = null;
				await transmit(signedTxHex)
					.then(res => transmitResp = res)
					.catch(err => transmitResp = err);


				if (transmitResp && transmitResp.txid) {
					txid.push(transmitResp.txid);
					// return txid
				} else {
					if (txid.length > 0) {
						return { txid, m: transmitResp }
					} else {
						throw new Error(transmitResp);
					}
				}

			} // end of for loop
		} //end of while loop

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