const Trivechaincore = require('@trivechain/trivechaincore-lib');
const TriveAssetProtocol = require('@trivechain/triveasset-protocol');
const Bitcoinjs = require('bitcoinjs-lib');
const { buildIssueAssetTXSchema } = require('./lib/validation');
const properties = require('./lib/properties');
const { getAddressesUtxo, getUtxosDetail, transmit, uploadMetadata } = require('./lib/helper');

const { Address, Networks, PrivateKey } = Trivechaincore;
const { TransactionBuilder } = TriveAssetProtocol;

const utxoLimit = properties.utxoLimit;

const buildIssueAssetTX = async (args) => {
  try {
    let params = await buildIssueAssetTXSchema.validateAsync(args);

    if (!Address.isValid(params.issueAddress, Networks[params.network])) {
        throw new Error(`${params.issueAddress} is not a valid address on ${params.network}`);
      }
    if (!Address.isValid(params.financeChangeAddress, Networks[params.network])) {
      throw new Error(`${params.financeChangeAddress} is not a valid address on ${params.network}`);
    }

    if (params.privateKey) {
      for (const pk of params.privateKey) {
        if (!PrivateKey.isValid(pk, Networks[params.network])) {
          throw new Error(`Private key is not valid on ${params.network}`);
        }
      }
    }

    let utxos = [];

    if (params.issueAddress) {
      let skip = 0;
      let loop = true;
      while (loop) {
        let tempUtxos;
        await getAddressesUtxo(params.network, [params.issueAddress], utxoLimit, skip)
          .then(res => { tempUtxos = res; })
          .catch(err => { throw new Error(err); });

        utxos = utxos.concat(tempUtxos.utxos);

        if (tempUtxos.totalCount === utxos.length) {
          loop = false;
        } else {
          skip += utxoLimit;
        }
      }
    } else {
      const txidsIndexes = [];
      for (const utxo of params.utxos) {
        txidsIndexes.push(`${utxo.txid}:${utxo.index}`);
      }

      await getUtxosDetail(params.network, txidsIndexes)
        .then(res => { utxos = res.utxos; })
        .catch(err => { throw new Error(err); });
    }

    const inputUtxos = params.utxos;
    params.utxos = [];
    for (let i = utxos.length - 1; i >= 0; i--) {
      if (utxos[i].iscoinbase && !utxos[i].isConfirmed) continue;

      utxos[i].value = utxos[i].valueSat;
      params.utxos.push(utxos[i]);
    }

    // check user input utxos got unconfirmed or invalid utxo
    if (!params.issueAddress && inputUtxos.length !== params.utxos.length) {
      throw new Error('Some of the utxos is invalid, please make sure all utxos is confirmed and valid.');
    }

    await uploadMetadata(params)
      .then(res => { params = res; })
      .catch(err => { throw new Error(err); });

    const tabuilder = new TransactionBuilder({ network: params.network });

    const txBuilt = await tabuilder.buildIssueTransaction(params);

    // return unsigned tx hex
    if (!params.privateKey) {
      return { unsignedTxHex: txBuilt.txHex };
    }

    const txb = txBuilt.txb;

    for (const priv of params.privateKey) {
      const privateKey = new Bitcoinjs.ECPair.fromWIF(priv, txb.network);
      for (let i = 0; i < txb.tx.ins.length; i++) {
        if (txb.inputs[i].prevOutType == 'pubkeyhash') {
          if (new Trivechaincore.Script.fromAddress(privateKey.getAddress()).toHex() == Buffer.from(txb.inputs[i].prevOutScript).toString('hex')) {
            txb.inputs[i].scriptType = null;
            txb.sign(i, privateKey);
          }
        } else if (txb.inputs[i].prevOutType == 'scripthash') {
          const pubKey = Buffer.from(privateKey.getPublicKeyBuffer()).toString('hex');
          const scriptAddress = new Trivechaincore.Address([pubKey], 1).toString();

          if (new Trivechaincore.Script.fromAddress(scriptAddress).toHex() == Buffer.from(txb.inputs[i].prevOutScript).toString('hex')) {
            txb.inputs[i].scriptType = null;
            const redeemScript = Trivechaincore.Script.buildP2SHMultisigIn([pubKey], 1, []).chunks[1].buf;
            txb.sign(i, privateKey, redeemScript);
          }
        }
      }
    }

    for (let j = 0; j < txb.tx.ins.length; j++) {
      if (!txb.inputs[j].redeemScript) {
        throw new Error(`Input not signed: ${txb.tx.ins[j].hash.reverse().toString('hex')}:${txb.tx.ins[j].index}`)
      }
    }

    const tx = txb.build();
    const signedTxHex = tx.toHex();
    // return signed tx hex
    if (!params.transmit) {
      return { signedTxHex };
    }

    let transmitResp = null;
    await transmit(params.network, signedTxHex)
      .then(res => { transmitResp = res; })
      .catch(err => { throw new Error(err); });

    return transmitResp;
  } catch (err) {
    console.error(err);
    return err;
  }
};

module.exports = buildIssueAssetTX;