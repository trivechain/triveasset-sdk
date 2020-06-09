const Trivechaincore = require('@trivechain/trivechaincore-lib');
const TriveAssetProtocol = require('@trivechain/triveasset-protocol');
const bitcoin = require('bitcoinjs-lib');
const { sendBuildAssetTXSchema } = require('./lib/validation');
const properties = require('./lib/properties');
const { getAddressesUtxo, getUtxosDetail, transmit, uploadMetadata } = require('./lib/helper');

const { Address, Networks, PrivateKey } = Trivechaincore;
const { TransactionBuilder } = TriveAssetProtocol;

const utxoLimit = properties.utxoLimit;

const buildSendAssetTX = async (args) => {
  try {
    let params = await sendBuildAssetTXSchema.validateAsync(args);

    if (params.from) {
      for (let addr of params.from) {
        if (!Address.isValid(addr, Networks[params.network])) {
          throw new Error(`${addr} is not a valid address on ${params.network}`);
        }
      }
      if (!Address.isValid(params.coloredChangeAddress, Networks[params.network])) {
        throw new Error(`Address ${params.coloredChangeAddress} is not valid on ${params.network}`);
      }
    }
    if (!Address.isValid(params.financeChangeAddress, Networks[params.network])) {
      throw new Error(`${params.financeChangeAddress} is not a valid address on ${params.network}`);
    }
    if (params.privateKey) {
      for (let pk of params.privateKey) {
        if (!PrivateKey.isValid(pk, Networks[params.network])) {
          throw new Error(`Private key is not valid on ${params.network}`);
        }
      }
    }



    let utxos = [];

    if (params.from) {
      let skip = 0;
      let loop = true;
      while (loop) {
        let tempUtxos;
        await getAddressesUtxo(params.from, utxoLimit, skip)
          .then(res => tempUtxos = res)
          .catch(err => { throw new Error(err) });

        utxos = utxos.concat(tempUtxos.utxos);

        if (tempUtxos.totalCount === utxos.length) {
          loop = false;
        } else {
          skip += utxoLimit;
        }
      }
    } else {
      let txidsIndexes = [];
      for (let utxo of params.utxos) {
        txidsIndexes.push(`${utxo.txid}:${utxo.index}`)
      }

      await getUtxosDetail(txidsIndexes)
        .then(res => utxos = res.utxos)
        .catch(err => { throw new Error(err) });
    }

    const inputUtxos = params.utxos;
    params.utxos = [];
    for (let i = utxos.length - 1; i >= 0; i--) {
      if (utxos[i].iscoinbase && !utxos[i].isConfirmed) continue;

      utxos[i].value = utxos[i].valueSat;
      params.utxos.push(utxos[i]);
    }

    // check user input utxos got unconfirmed or invalid utxo
    if (!params.from && inputUtxos.length !== params.utxos.length) {
      throw new Error('Some of the utxos is invalid, please make sure all utxos is confirmed and valid.')
    }

    // by this time, 'from' should be deleted
    if (params.from) {
      delete params.from;
    }

    await uploadMetadata(params)
      .then(res => { params = res })
      .catch(err => { throw new Error(err) });

    const tabuilder = new TransactionBuilder({ network: params.network });

    const txBuilt = await tabuilder.buildSendTransaction(params);

    //return unsigned tx hex
    if (!params.privateKey) {
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
    //return signed tx hex
    if (!params.transmit) {
      return { signedTxHex }
    }

    let transmitResp = null;
    await transmit(signedTxHex)
      .then(res => transmitResp = res)
      .catch(err => { throw new Error(err) });

    return transmitResp;

  } catch (err) {
    console.error(err)
    return err;
  }
}

module.exports = buildSendAssetTX;
