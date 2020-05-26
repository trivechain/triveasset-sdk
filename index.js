const Trivechaincore = require('@trivechain/trivechaincore-lib');
const TriveAssetProtocol = require('@trivechain/triveasset-protocol');
const { sendBuildAssetTXSchema } = require('./validation');
const { getUtxo, getUtxoDetail, transmit } = require('./helper');

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
		if (params.privateKey && !PrivateKey.isValid(params.PrivateKey, Networks[params.network])) {
			throw new Error(`Private key is not a valid address on ${params.network}`);
		}

		let utxos = null;
		if (params.from) {
			await getUtxo(params.from)
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

		params.utxos = [];
		// params.utxos = utxos.map(u => {
		// 	if (u.isConfirmed) return u;
		// })
		for (let u of utxos) {
			if (u.isConfirmed) params.utxos.push(u);
		}
		console.log(params)

		const tabuilder = new TransactionBuilder({ network: params.network });

		const txBuilt = await tabuilder.buildSendTransaction(params);

		let tx = bitcoin.Transaction.fromHex(assetInfo.txHex);

		//return unsigned tx hex
		if (!params.privateKey) {
			return { unsignedTxHex: tx }
		}

		let txb = bitcoin.TransactionBuilder.fromTransaction(tx);

		for (var i = 0; i < tx.ins.length; i++) {
			for (let priv of params.privateKey) {
				txb.inputs[i].scriptType = null;
				const privateKey = new bitcoin.ECKey.fromWIF(priv);
				txb.sign(i, privateKey)
			}
		}

		tx = txb.build();

		const signedTxHex = tx.toHex();

		//return signed tx hex
		if (!params.transmit) {
			return { signedTxHex: signedTxHex }
		}

		let transmitResp = null;
		await transmit(signedTxHex)
			.then(res => transmitResp = res)
			.catch(err => { throw new Error(err) });

		return transmitResp;

	} catch (err) {
		console.log('--CATCH--')
		console.error(err)
		return new Error(err);
	}
}

buildSendAssetTX('your params');