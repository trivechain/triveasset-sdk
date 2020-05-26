const Trivechaincore = require('@trivechain/trivechaincore-lib');
const TriveAssetProtocol = require('@trivechain/triveasset-protocol');
const { sendBuildAssetTXSchema } = require('./validation');
const { getUtxo } = require('./helper');

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
			await getUtxo(params.from)
				.then(res => utxos = res)
				.catch(err => { throw new Error(err) })

			utxos = utxos.utxos

			params.utxos = utxos.map(u => {
				if (u.isConfirmed) return u;
			})
			console.log(params)

			const txBuilt = await TransactionBuilder.buildSendTransaction(params);
			let tx = bitcoin.Transaction.fromHex(assetInfo.txHex);

			if (!params.privateKey) {
				return { tx }
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
			
			return tx.toHex();
		}
	} catch (err) {
		console.log('--CATCH--')
		console.error(err)
		return new Error(err);
	} finally {

	}
}

buildSendAssetTX({
	from: ['TKcoddAZynsappLzdSNRqbmqBnUVqmKFxx'],
	to: [{
		address: 'TKcoddAZynsappLzdSNRqbmqBnUVqmKFxx',
		amount: 26,
		assetId: 'La6QE251sQAT9GaMTWhYejJn5cNKPVNpoe7jW9',
	}],
	financeChangeAddress: 'TKcoddAZynsappLzdSNRqbmqBnUVqmKFxx',
	coloredChangeAddress: 'TKcoddAZynsappLzdSNRqbmqBnUVqmKFxx',
	network: 'mainnet'
});