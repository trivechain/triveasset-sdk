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
		// if (params.from) {
		// 	await getUtxo(params.from)
		// 		.then(res => utxos = res)
		// 		.catch(err => { throw new Error(err) })
		// } else {
		// 	const txidsIndexes = params.utxos.map(utxo => {
		// 		const utxoParts = utxo.split(':');
		// 		return {
		// 			txid: utxoParts[0],
		// 			index: utxoParts[1],
		// 		}
		// 	})

		// 	await getUtxoDetail(txidsIndexes)
		// 		.then(res => utxos = res)
		// 		.catch(err => { throw new Error(err) });
		// }

		// utxos = utxos.utxos
		utxos = [
			{
				index: 2,
				txid: '7cbd93749ead00bdcd62757f48d85a4503cf75233c6ef0a5b96d2584a4856270',
				scriptPubKey: [Object],
				blockheight: 761746,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -761746
			},
			{
				index: 4,
				txid: '1d38b5b67361225b5bd02c4a91fc78871ee18e9787794a30b58dab6d3c12e3d1',
				scriptPubKey: [Object],
				blockheight: 759312,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -759312
			},
			{
				index: 2,
				txid: 'f0eddeb6004d37e60c23fd56ce4c8fd2e4dd63f5056652be9406aa90c5056405',
				scriptPubKey: [Object],
				blockheight: 758370,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -758370
			},
			{
				index: 3,
				txid: '6eb41ccb63d282d7d5e0bb4ae09bd782ff2d4fc16ac2a52402fdd6782f8bf33b',
				scriptPubKey: [Object],
				blockheight: 757917,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -757917
			},
			{
				index: 3,
				txid: '8faf5aabdfebb027f1ef39b3d09b1f4e0cc718d887e452ac000289e9b9f736e8',
				scriptPubKey: [Object],
				blockheight: 749792,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -749792
			},
			{
				index: 3,
				txid: 'df81bb9c5211980ffffceda08591e54f3ceda1166f8f3675b245c513bdec02bc',
				scriptPubKey: [Object],
				blockheight: 749789,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -749789
			},
			{
				index: 3,
				txid: 'e334d3a9a69c2a1fd16ff5fdd1db3649ef9567d6564717b07d4d544307cbc711',
				scriptPubKey: [Object],
				blockheight: 749302,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -749302
			},
			{
				index: 3,
				txid: 'fe13fd5b54dd2a981c64098d4fda2d6b8d8471bba58152880e09249de1b52803',
				scriptPubKey: [Object],
				blockheight: 749267,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -749267
			},
			{
				index: 3,
				txid: 'f09afa76bf581b251fcf7ea08a391ba13706460fe38a45377f0aa877664c2f71',
				scriptPubKey: [Object],
				blockheight: 749081,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -749081
			},
			{
				index: 3,
				scriptPubKey: [Object],
				blockheight: 749045,
				value: 0.00005441,
				assets: [Array],
				iscoinbase: false,
				isConfirmed: false,
				confirmation: -749045
			}
		]

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

buildSendAssetTX({
	from: ['TKcoddAZynsappLzdSNRqbmqBnUVqmKFxx'],
	to: [{
		address: 'TKcoddAZynsappLzdSNRqbmqBnUVqmKFxx',
		amount: 1,
		assetId: 'La6QE251sQAT9GaMTWhYejJn5cNKPVNpoe7jW9',
	}],
	financeChangeAddress: 'TKcoddAZynsappLzdSNRqbmqBnUVqmKFxx',
	coloredChangeAddress: 'TKcoddAZynsappLzdSNRqbmqBnUVqmKFxx',
	network: 'mainnet'
});