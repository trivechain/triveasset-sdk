
const ColoredCoins = require('../trivetoken-sdk');

const config = {
  network: 'mainnet',
  coloredCoinsHost: 'https://asset.trivechain.com/api/v3',
  blockExplorerHost: 'https://asset.trivechain.com/explorer-api',
  metadataServerHost: 'https://asset.trivechain.com/metadata',
  mnemonic: 'infant tomato raven impulse surround march drama catch system settle this misery'
};

let cc = new ColoredCoins(config);

cc.on('connect', function () {
  console.log("mnemonic: ", cc.hdwallet.getMnemonic());
  console.log(cc.hdwallet.getAddress(0, 0));
})

cc.init()
