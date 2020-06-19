const Trivechaincore = require('@trivechain/trivechaincore-lib');
const TriveAssetProtocol = require('@trivechain/triveasset-protocol');
const Bitcoinjs = require('bitcoinjs-lib');
const { utxoConsolidationSchema } = require('./lib/validation');
const properties = require('./lib/properties');
const { getAddressesUtxo, transmit, uploadMetadata } = require('./lib/helper');

const { Address, Networks, PrivateKey } = Trivechaincore;
const { TransactionBuilder } = TriveAssetProtocol;

const utxoLimit = properties.utxoLimit;

const utxoConsolidation = async (args) => {
   try {
      let params = await utxoConsolidationSchema.validateAsync(args);

      for (const addr of params.from) {
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
         for (const pk of params.privateKey) {
            if (!PrivateKey.isValid(pk, Networks[params.network])) {
               throw new Error(`Private key is not valid on ${params.network}`);
            }
         }
      }

      const tabuilder = new TransactionBuilder({ network: params.network });

      const unsignedTxHexArray = [];
      const signedTxHexArray = [];
      const txidArray = [];

      let assetValueSat = BigInt(0);
      let utxoToSend = [];
      let fee = BigInt(3000);
      let build = false;
      params.utxos = [];

      let skip = 0;
      let loopApi = true;

      while (loopApi) {
         let utxos = null;
         await getAddressesUtxo(params.network, params.from, utxoLimit, skip, params.assetId)
            .then(res => { utxos = res; })
            .catch(err => { throw new Error(err); });

         console.log('numOfUtxos:', utxos.totalCount);

         utxos = utxos.utxos;

         // check if this is the last loop
         if (utxos.length < utxoLimit) {
            loopApi = false;
         } else {
            skip += utxoLimit;
         }

         for (let i = utxos.length - 1; i >= 0; i--) {
            if (utxos[i].iscoinbase && !utxos[i].isConfirmed) continue;

            // for asset
            for (const a of utxos[i].assets) {
               if (a.assetId === params.assetId) {
                  utxos[i].value = utxos[i].valueSat;
                  assetValueSat += BigInt(a.amount);
                  utxoToSend.push(utxos[i]);
                  fee += BigInt(1000);
                  break;
               }
            }
            // console.log(i, utxoToSend.length, !loopApi)
            // if number of utxos reach maximum || this is the last utxo ever from the address and has more than 50 utxo
            if (utxoToSend.length >= 5 || (i === 0 && utxoToSend.length >= 3 && !loopApi)) build = true;

            if (!build) continue;

            params.to = [{
               address: params.coloredChangeAddress,
               amount: Number(assetValueSat),
               assetId: params.assetId
            }];
            params.utxos = utxoToSend;
            params.fee = Number(fee);

            // re-declare into initial value for next for loop
            utxoToSend = [];
            assetValueSat = BigInt(0);
            fee = BigInt(3000);
            build = false;

            // don't have to upload ipfs everytime since it is the same metadata
            if (params.metadata && !params.ipfsHash) {
               await uploadMetadata(params)
                  .then(res => { params = res; })
                  .catch(err => { throw new Error(err); });
            }
            // console.log(params)
            const txBuilt = await tabuilder.buildSendTransaction(params);

            // return unsigned tx hex
            if (!params.privateKey) {
               unsignedTxHexArray.push({
                  amount: params.to[0].amount,
                  unsignedTxHex: txBuilt.txHex
               });
               continue;
            }

            const txb = txBuilt.txb;

            for (const priv of params.privateKey) {
               const privateKey = new Bitcoinjs.ECPair.fromWIF(priv, txb.network);
               for (let j = 0; j < txb.tx.ins.length; j++) {
                  if (txb.inputs[j].prevOutType == 'pubkeyhash') {
                     if (new Trivechaincore.Script.fromAddress(privateKey.getAddress()).toHex() == Buffer.from(txb.inputs[j].prevOutScript).toString('hex')) {
                        txb.inputs[j].scriptType = null;
                        txb.sign(j, privateKey);
                     }
                  } else if (txb.inputs[j].prevOutType == 'scripthash') {
                     const pubKey = Buffer.from(privateKey.getPublicKeyBuffer()).toString('hex');
                     const scriptAddress = new Trivechaincore.Address([pubKey], 1).toString();

                     if (new Trivechaincore.Script.fromAddress(scriptAddress).toHex() == Buffer.from(txb.inputs[j].prevOutScript).toString('hex')) {
                        txb.inputs[j].scriptType = null;
                        const redeemScript = Trivechaincore.Script.buildP2SHMultisigIn([pubKey], 1, []).chunks[1].buf;
                        txb.sign(j, privateKey, redeemScript);
                     }
                  }
               }
            }

            // console.log(txb.inputs)
            // console.log(txb.tx.ins[0])
            // console.log(txb.tx.ins[0].hash.reverse().toString('hex'))

            const tx = txb.build();
            const signedTxHex = tx.toHex();

            // return signed tx hex
            if (!params.transmit) {
               signedTxHexArray.push({
                  amount: params.to[0].amount,
                  signedTxHex,
               });
               continue;
            }

            let transmitResp = null;
            await transmit(params.network, signedTxHex)
               .then(res => { transmitResp = res; })
               .catch(err => { transmitResp = err; });

            if (transmitResp && transmitResp.txid) {
               txidArray.push({
                  amount: params.to[0].amount,
                  txid: transmitResp.txid
               });

            } else {
               if (txidArray.length > 0) {
                  return { txid: txidArray, m: transmitResp };
               } else {
                  throw new Error(transmitResp);
               }
            }
         } // end of for loop
      } // end of while loop

      if (txidArray.length) {
         return { txid: txidArray };
      }

      if (signedTxHexArray.length) {
         return { signedTxHex: signedTxHexArray };
      }

      if (unsignedTxHexArray.length) {
         return { unsignedTxHex: unsignedTxHexArray };
      }

      throw new Error('Not enough utxo to perform consolidation')
   } catch (err) {
      console.error(err);
      return err;
   }
};

module.exports = utxoConsolidation;
