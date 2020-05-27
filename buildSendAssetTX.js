const Trivechaincore = require('@trivechain/trivechaincore-lib');
const TriveAssetProtocol = require('@trivechain/triveasset-protocol');
const bitcoin = require('bitcoinjs-lib');
const { sendBuildAssetTXSchema, utxoConsolidationSchema } = require('./validation');
const { getAddressesUtxo, getUtxoDetail, transmit, sleep } = require('./helper');

const { Address, Networks, PrivateKey } = Trivechaincore;
const { TransactionBuilder } = TriveAssetProtocol;

const buildSendAssetTX = async (args) => {
	try {
		let params = await sendBuildAssetTXSchema.validateAsync(args);

		if (params.from) {
			for (let addr of params.from) {
				if (!Address.isValid(addr, Networks[params.network])) {
					throw new Error(`${addr} is not a valid address on ${params.network}`);
				}
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

		let utxos = null;
		if (params.from) {
			await getAddressesUtxo(params.from)
				.then(res => utxos = res)
				.catch(err => { throw new Error(err) })
		} else {
			const txidsIndexes = params.utxos.map(utxo => {
				const utxoParts = utxo.split(':');
				return {
					txid: utxoParts[0],
					index: utxoParts[1],
				}
			})

			await getUtxoDetail(txidsIndexes)
				.then(res => utxos = res)
				.catch(err => { throw new Error(err) });
		}

		utxos = utxos.utxos

		const inputUtxos = params.utxos;
		params.utxos = [];
		for (let u of utxos) {
			if (u.iscoinbase && !u.isConfirmed) continue;

			u.value = u.valueSat;
			params.utxos.push(u);
		}

		// check user input utxos got unconfirmed or invalid utxo
		if (!params.from && inputUtxos.length !== params.utxos.length) {
			throw new Error('Some of the utxos is invalid, please make sure all utxos is confirmed and valid.')
		}

		const tabuilder = new TransactionBuilder({ network: params.network });

		const txBuilt = await tabuilder.buildSendTransaction(params);

		//return unsigned tx hex
		if (!params.privateKey) {
			console.log({ unsignedTxHex: txBuilt.txHex })
			return { unsignedTxHex: txBuilt.txHex }
		}

		let txb = txBuilt.txb

		for (let priv of params.privateKey) {
			const privateKey = new bitcoin.ECPair.fromWIF(priv, txb.network);
			for (var i = 0; i < txb.tx.ins.length; i++) {
				if (new Trivechaincore.Script.fromAddress(privateKey.getAddress()).toHex() == Buffer.from(txb.inputs[i].prevOutScript).toString('hex')) {
					txb.inputs[i].scriptType = null;
					txb.sign(i, privateKey)
				}
			}
		}

		tx = txb.build();

		const signedTxHex = tx.toHex();
		console.log(signedTxHex)
		//return signed tx hex
		if (!params.transmit) {
			return { signedTxHex: signedTxHex }
		}

		let transmitResp = null;
		await transmit(signedTxHex)
			.then(res => transmitResp = res)
			.catch(err => { throw new Error(err) });
		console.log(transmitResp)
		return transmitResp;

	} catch (err) {
		console.log('--CATCH--')
		console.error(err)
		return err;
	}
}

module.exports = buildSendAssetTX;
