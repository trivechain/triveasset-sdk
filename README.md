# triveasset-sdk
[![Standard - JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Easy to use SDK for issuing and transferring digital assets using [TriveAsset protocol](https://github.com/trivechain/triveasset-protocol) on top of trivechain blockchain technology.
Coupled with state-of-the-art [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) & [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) hierarchical deterministic wallet to hold your assets.

## Installation
``` bash
npm install github:trivechain/triveasset-sdk
```

## Usage

```js
var TriveAsset = require("triveassets-sdk")
const config = {
  network: "testnet",
  triveAssetHost: "https://explorer.trivechain.com",
  blockExplorerHost: "https://explorer.trivechain.com",
  metadataServerHost: "https://asset.trivechain.com/metadata",
  // Uncomment this line and replace with your mnemonic. A new mnemonic will be generated
  // mnemonic: ""
};

const ta = new TriveAsset(config);
```

The ```config``` object configure the package to integrate mainnet or testnet. The example of the parameters are as below:

| Parameter  | Testnet  | Mainnet  |
| ------------ | ------------ | ------------ |
| network  | testnet  | mainnet  |
| triveAssetHost  | https://<span/>explorer.trvc.dev  | https://<span/>explorer.trivechain.com  |
| blockExplorerHost  | https://<span/>explorer.trvc.dev  | https://<span/>explorer.trivechain.com  |
| metadataServerHost  | https://<span/>asset.trvc.dev/metadata  | https://<span/>asset.trivechain.com/metadata  |
| mnemonic  | -  | -  |

You can generate new mnemonic by removing ```mnemonic``` from the ```config```.
Now, initiate the package.

```js
ta.init(function (err) {
  // TriveAsset SDK is now ready
  // Get your mnemonic
  console.log("mnemonic: ", ta.hdwallet.getMnemonic())
  const address = ta.hdwallet.getAddress(0, 0) // Derive address in position 0,0 from mnemonic
  ta.hdwallet.getAddressPrivateKey(address, function(err, privkey) {
    // Derive the Private Key
    console.log("Address: ", address, ", privkey: ", privkey.getFormattedValue());
  })
  
  // Issue the Address
  const tatIssuanceParams = {
    amount: 100000000000000, // Amount = 1000000.00000000 (with divisibility)
    divisibility: 8, // The number of decimal (from 0 - 15 only)
    // Metadata will be uploaded to IPFS and the IPFS hash will be stored in the transaction
    metadata: {
        assetName: "TriveAsset Test",
        assetSymbol: "TAT",
        issuer: "Trivechain Limited",
        description: "The TriveAsset Test (TAT) is used to ensure that the asset is issued correctly",
        urls:[
          {
            name: "website",
            url: "https://trivechain.com",
            mimeType: "text/html",
          },
          {
            name: "icon_large", 
            url:"ipfs://QmafUtZoptBS3inSoNiwKF8VD9zt16DKXAhJv9itSi9EBG",
            mimeType:"image/png",
          },{
            name: "icon",
            url:"ipfs://QmRNPoyRkAxpBb1mY75X5cJxDtagv3uCVpoz8JQDRig8sN",
            mimeType:"image/png",
          }
        ]
    },
    lockStatus: true, // boolean
    issueAddress: "Issuance Address", //string
  }

  ta.issueAsset(tatIssuanceParams, function (err, body) {
    if (err) return console.error(err)
      console.log("Body: ",body)
  })

  //create a variable of the transaction you want to send
  let tatSendParams = {
    from: [ "Sender Address", ], //array
    to: [
      {
        address: "Receiver Address", //string
        assetId: "Asset ID", //string
        amount: 100000000, //Amount to send is without divisibility //int
      },
    ], //array object
    coloredChangeAddress: "Address to receive balance of the asset", //string
    financeChangeAddress: "Address to receive balance of TRVC", //string
    metadata: {
      description: "Any description", //string
      userData: {
        meta: [{
          key: "key", //string
          value: { example: "abc", }, //object
          type: "object" //string
        }]
      } //object (Optional)
    },
    transmit: false, // default: true. When it is false, it will return an signedTx Hex, else it will broadcast your transction straightaway.
  }
  
  //This will create, sign and/or broadcast your transaction
  ta.sendAsset(tatSendParams, function (err, body) {
      console.log(JSON.parse(err))
      console.log(body)
  })
})
```

## License

[Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0)
