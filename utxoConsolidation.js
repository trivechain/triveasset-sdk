const NOT_SAFE_utxoConsolidation = async (args) => {
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

		let utxos = null;
		await getAddressesUtxo(params.from)
			.then(res => utxos = res)
			.catch(err => { throw new Error(err) })
		console.log('numOfUtxos:', utxos.numOfUtxos);
		utxos = utxos.utxos;

		params.utxos = [];
		let utxosChunk = [];
		let assetValueSat = BigInt(0);
		let count = 0;

		// slice the utxos into utxosChunk
		for (let i in utxos) {
			let tempUtxo = [];
			if (!utxos[i].isConfirmed) continue;

			utxos[i].value = utxos[i].valueSat;

			for (let a of utxos[i].assets) {
				if (a.assetId === params.assetId) {
					// console.log('amount:', a.amount)
					assetValueSat += BigInt(a.amount);
					tempUtxo.push(utxos[i]);
					count += 1;
					break;
				}
			}

			// if finish looping, minimum 50 utxo to consolidate, else, 200 utxo every consolidation
			if (i === (utxos.length - 1) && count >= 2) {
				console.log('last:', count)
				utxosChunk.push({
					utxos: tempUtxo,
					amount: Number(assetValueSat),
				});

			} else if (count >= 5) {
				console.log('count:', count)
				utxosChunk.push({
					utxos: tempUtxo,
					amount: Number(assetValueSat),
				});
				count = 0;
			}
		}

		if (utxosChunk.length <= 0) {
			throw new Error('Your number of utxos is less than 50.')
		}

		const tabuilder = new TransactionBuilder({ network: params.network });

		let unsignedTxHex = [];
		let signedTxHex = [];
		let txid = [];

		console.log(utxosChunk[0].utxos.length);
		console.log(utxosChunk[1].utxos.length);
		console.log('utxosChunk length:', utxosChunk.length)

		// start build send asset
		for (let chunk of utxosChunk) {
			params.to = [{
				address: params.coloredChangeAddress,
				amount: chunk.amount,
				assetId: params.assetId,
			}]

			params.utxos = chunk.utxos

			const txBuilt = await tabuilder.buildSendTransaction(params);

			//return unsigned tx hex
			if (!params.privateKey) {
				console.log(txBuilt.txHex);
				unsignedTxHex.push(txBuilt.txHex);
				continue;
			}

			let tx = bitcoin.Transaction.fromHex(txBuilt.txHex);

			let txb = bitcoin.TransactionBuilder.fromTransaction(tx);

			for (var i = 0; i < tx.ins.length; i++) {
				for (let priv of params.privateKey) {
					txb.inputs[i].scriptType = null;
					const privateKey = new bitcoin.ECKey.fromWIF(priv);
					txb.sign(i, privateKey)
				}
			}

			tx = txb.build();

			const signedTx = tx.toHex();
			console.log(signedTxHex)
			//return signed tx hex
			if (!params.transmit) {
				signedTxHex.push(signedTx);
				continue;
			}

			let transmitResp = null;
			await transmit(signedTxHex)
				.then(res => transmitResp = res)
				.catch(err => transmitResp = err);


			if (transmitResp && transmitResp.txid) {
				txid.push(transmitResp.txid);
			} else {

				if (txid.length > 0) {
					return { txid, m: 'Some transaction failed to broadcast' }
				} else {
					throw new Error(transmitResp);
				}
			}
		}

		if (params.transmit) {
			return { txid }
		}

		if (params.privateKey) {
			return { signedTxHex }
		}

		return { unsignedTxHex }

	} catch (err) {
		console.log('--CATCH--')
		console.error(err)
		return err;
	}
}

module.exports = NOT_SAFE_utxoConsolidation;