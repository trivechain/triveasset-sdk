# trivetoken-sdk
[![Build Status](https://travis-ci.org/Colored-Coins/colored-coins-sdk.svg?branch=master)](https://travis-ci.org/Colored-Coins/colored-coins-sdk)
[![Coverage Status](https://coveralls.io/repos/github/Colored-Coins/colored-coins-sdk/badge.svg?branch=master)](https://coveralls.io/github/Colored-Coins/colored-coins-sdk?branch=master)
[![npm version](https://badge.fury.io/js/triveassets-sdk.svg)](http://badge.fury.io/js/triveassets-sdk)
[![Slack channel](http://slack.triveassets.org/badge.svg)](http://slack.triveassets.org)

[![Standard - JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Easy to use SDK for issuing and transferring digital assets using [Colored-Coins protocol](https://github.com/Colored-Coins/Colored-Coins-Protocol-Specification) on top of blockchain technology.
Coupled with state-of-the-art [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) & [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) hierarchical deterministic wallet to hold your assets.

## Usage

```js
const TriveAsset = require('triveassets-sdk')
const config = {
  network: 'testnet',
  triveAssetHost: 'https://explorer.trvc.dev',
  blockExplorerHost: 'https://explorer.trvc.dev',
  metadataServerHost: 'https://asset.trivechain.com/metadata',
  // Uncomment this line and replace with your mnemonic. A new mnemonic will be generated
  // mnemonic: 'permit foam proof estate polar endorse shed scorpion own truth blue siege hen uniform enact'
};

const ta = new TriveAsset(config);

ta.init(function (err) {
  // TriveAsset SDK is now ready
  // Get your mnemonic
  console.log("mnemonic: ", ta.hdwallet.getMnemonic())
  const address = ta.hdwallet.getAddress(0, 1) // Derive address in position 0,0 from mnemonic
  ta.hdwallet.getAddressPrivateKey(address, function(err, privkey) {
    // Derive the Private Key
    console.log("Address: ", address, ", privkey: ", privkey.getFormattedValue());
  })
  
  // Issue the Address
  const tatIssuanceParams = {
    amount: 100000000000000, // Amount = 1000000.00000000 (with divisibility)
    divisibility: 8,
    metadata: {
        assetName: 'TriveAsset Test',
        assetSymbol: 'TAT',
        issuer: 'Trivechain Limited',
        description: "The TriveAsset Test (TAT) is used to ensure that the asset is issued correctly",
        urls:[
          {
            name: "website",
            url: "https://trivechain.com",
            mimeType: "text/html",
          },{
            name: "icon_large", 
            url:"ipfs://QmcE93H8ejgG9AVFKnkMbRM61b9vsWX6QQyx4B2rvNaaaU",
            mimeType:"image/png",
          },{
            name: "icon",
            url:"ipfs://QmeuVseyqhH6gyVRvw9Xtvf6UqA51ZEfRezJAbykwE7vPn",
            mimeType:"image/png",
          }
        ]
    },
    lockStatus: true,
    fee: 1000,
    issueAddress: address,
    financeChangeAddress: address,
  }

  ta.issueAsset(tatIssuanceParams, function (err, body) {
    if (err) return console.error(err)
      console.log("Body: ",body)
  })
})
```

## License

[Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0)
