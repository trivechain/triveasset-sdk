const fetch = require('node-fetch');
const properties = require('./properties');
const MetadataServer = require('./metadataServer');

exports.getAddressesUtxo = (network, addresses, limit, skip, assetId = null) => {
  let url = `${properties.trivechainApi[network]}/utxos/address?limit=${limit}&skip=${skip}`;
  if (assetId) url += `&assetId=${assetId}`;

  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'post',
      body: JSON.stringify({ addresses }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(json => { return resolve(json); })
      .catch(err => { return reject(err); });
  });
};

exports.getUtxosDetail = (network, utxos) => {
  return new Promise((resolve, reject) => {
    fetch(`${properties.trivechainApi[network]}/utxos`, {
      method: 'post',
      body: JSON.stringify({ utxos }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(json => { return resolve(json); })
      .catch(err => { return reject(err); });
  });
};

exports.transmit = (network, txHex) => {
  return new Promise((resolve, reject) => {
    fetch(`${properties.trivechainApi[network]}/rpc/transmit`, {
      method: 'post',
      body: JSON.stringify({ txHex }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(json => { return resolve(json); })
      .catch(err => { return reject(err); });
  });
};

exports.sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

exports.uploadMetadata = (params) => {
  return new Promise((resolve, reject) => {
    const metadataServer = new MetadataServer();
    metadataServer.upload(params, function (err, newParams) {
      if (err) return reject(err);

      return resolve(newParams);
    });
  });
};
