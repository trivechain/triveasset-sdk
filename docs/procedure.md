## Procedure to issue,transfer and burn asset with trivetoken-sdk

The SDK is meant to be used in your own trive apps, in order to enable creating and transacting digital assets using the trivechain protocols. It's a JavaScript SDK.
We will be using Node.js in this guide. Please make sure you have it installed Nodsjs and Npm version 6.

1. Let's start by cloning 'trivetoken-sdk' from [here](https://github.com/trivechain/trivetoken-sdk.git)

2. cd trivetoken-sdk -> npm install 

3. Let's create a file named index.js and open that in your favorite editor. We'll start by initializing the SDK object, specifying your mnemonic and network.

What's a mnemonic?

The "mnemonic" is a random list of 12 words that will be automatically created,when a new wallet is made to store your trvc coins.

Network - For testing you can use 'testnet' Once your wallet is ready for production, you'll switch it to mainnet, for the "real money" trivecoin.

Generating your mnemonic for the first time
Go ahead and type the following into your index.js file:

```javascript
var TriveAsset = require('./trivetoken-sdk')

var settings = {
  network: 'testnet',
  mnemonic: null
}

var cc = new TriveAsset(settings)

cc.on('connect', function() {
  console.log("mnemonic: ", cc.hdwallet.getMnemonic())
})

cc.init();
```
We create a settings object, specifying the **testnet** network, and no mnemonic. This means a new **mnemonic** will be generated for us. We than initailize a **cc** SDK object with the **settings**, and register the **connect** event with a function that will print out the mnemonic. Finially we run **cc.init()** to tell the SDK to connect to our servers. Once connected, it will fire the connect event and print the mnemonic.

You can run this code with -> **node index.js**.

In a real app, you would now store that mnemonic in a safe place, and use that same mnemonic the next time you initialize the TriveAsset SDK. For the purpose of this guide, just copy the mnemonic into the settings object, like so (but do it with your own mnemonic!):
```
var settings = {
  network: 'mainnet',
  mnemonic: 'your wallet mnemonic'
}
```
Now, every time you run this code, you'll use the same identity.

### Issuing a digital asset

Go ahead and change your code:
```
cc.on('connect', function() {

  var asset = {
      amount: 500,
      metadata: {
          assetName: 'trive Lira',
          issuer: 'trive Central Bank',
          description: "The asset of the People's playing with trivecoin"
      },
      fee: 1000,
      issueAddress: cc.hdwallet.getAddress(0, 0)
  }

  cc.issueAsset(asset, function (err, body) {
    if (err) return console.error(err)
      console.log("Body: ",body)
  })
})
```
With the asset object, we're specifying a new asset. It will have 500 units (so 500 trive Liras). It also specifies some metadata. The metadata could be anything you'd like.The specified fee is how much you're going to pay for the miner fee on that transaction. It's denominated in "satoshis". 

We then use issueAsset() to send the request to the trivecoins node and issue the asset. When the request returns, we print the body.

Run it!

You'll see an error like this:

{ explanation: 'address fYxZYL9nVzmdn5eBJyD18mzjtnyM8joUhS does not have any unused outputs',
  code: 20003,
  status: 500,
  name: 'NotEnoughFundsError',
  message: 'Not enough satoshi to cover transaction',
  type: 'issuance' }

We get this error because we didn't send enough coins to cover the fee to this address. 
```
Body:  { txHex: '01000085e54a5000a76f0c2c09d645a57dd4cad0000165e150aefa77cb799a1d9072d28365020000006a473044022079555c0df188771a0ca153b8890b982a9aecdc8132c21af4bdeccf29367d6fbd022023620212de627ae0ebaabe4c07371e4f1f9184ef50763a511b4ae18d4f4bc12b0121039efc0bb7d8d4374cc696023e71fc39e6bee6565f4065aed0a3717e81c38bce9affffffff0300000000000000003d6a3b43430201a2c1f99866f7e843dad04b47dd85dc761027c3a14edbef1c024e9dd38729dd5544b642af1985158aea7d85acd6b4b80d868b051320521090480301000000001976a914d2dcdfe8bd61c2313852b5f19f70a22988b50e5e88ac58020000000000001976a914d2dcdfe8bd61c2313852b5f19f70a22988b50e5e88ac00000000',
  assetId: 'La6r7PVFttyVYMERnwHSpUfpQJrbkUHQtSpRrT',
  OutputIndexes: [ 2 ],
  txid: 'ef2d340ad797f5a04fe328a0d0daed5b89f616e28878309dd00735a52d46aadd',
  receivingAddresses: [],
  issueAddress: 'fYxZYL9nVzmdn5eBJyD18mzjtnyM8joUhS' }
```
The important part is the assetId. This is the ID of your newly-issued asset and this is what you will use to identify it in your app. You can launch the trivechain Block Explorer and enter the Asset ID you got in the response, and look at its details, like how many were created, its name, and so on. Congrats!

### Sending asset units
Sending some trive Liras is easy with the TriveAsset SDK. First, make sure you issued an asset in the last section, and take note of the returned Asset ID. Then, you can use the following code:

```
cc.on('connect', function() {

  var assetId = 'YOUR_ASSET_ID_HERE'
  
  var send = {
    from: [cc.hdwallet.getAddress(0, 0)],
    to: [{
      address: 'FsNtZGAmgrhPJzH37YctHgvgEhJQ2A62ss',
      assetId: assetId,
      amount: 1
    }],
    fee: 1000
  }

  cc.sendAsset(send, function (err, body) {
    if (err) return console.error(err)
      console.log("Body: ",body)
  })
})
```
Make sure to enter your own Asset ID in the appropriate variable. Also note that you have to specify the address you're sending from, which must have enough Liras to send. 
Look at the txid property from your response - you can copy that into the Block Explorer and see your transaction.

### Burning asset units
With trivetoken, anyone holding units of an asset can burn (destroy) them. 
```
cc.on('connect', function() {

  var args = {
    from: [cc.hdwallet.getAddress(0, 0)],
    burn: [{
      assetId: 'YOUR_ASSET_HERE',
      amount: 5
    }],
    fee: 1000
  }

  cc.burnAsset(args, function (err, body) {
    if (err) return console.error(err)
      console.log("Body: ", body)
  })
})
```
As before, you must specify a miner's fee, your asset's ID, and a from address (or array of addresses) to burn units from. So this address must hold units of course. You'll get a response like this:
```
Body:  { txHex: '010000b1fecc1ac48910db7514eea1ddd6e89a40002c07ef698d5a8d7e734e386b35380494040000006b483045022100a9e64b0210cfa71bc0a31db5f301b71fc77b112096d94a3b7d4019c63168fc3702203d1b9e4c11e245dd981a8ab845c80aee7dd6d3f0ec03f68307ccb2211a2b9e060121039efc0bb7d8d4374cc696023e71fc39e6bee6565f4065aed0a3717e81c38bce9affffffffc07ef698d5a8d7e734e3b1fecc1ac48910db7514eea1ddd6e89a486b35380494030000006b4830450221008b4e200bf8efb0e522587ab47903ba05262b1c169e504ebedd3d86675ee9a71c02203b60b4e0b49eaec98f7483e39a11da48f58e46fd6fde7c7424128adb8ab315820121039efc0bb7d8d4374cc696023e71fc39e6bee6565f4065aed0a3717e81c38bce9affffffff030000000000000000086a06434302251f05103c0301000000001976a914d2dcdfe8bd61c2313852b5f19f70a22988b50e5e88ac58020000000000001976a914d2dcdfe8bd61c2313852b5f19f70a22988b50e5e88ac00000000',
  multisigOutputs: [],
  OutputIndexes: [ 2 ],
  txid: 'c49aa8660078bc349dc71b1c0aace5bd57e8af5994e69d99725786a54a0d683a' }
```
With the Block Explorer, you can search for your address or Asset ID, and see that units were burned. You can also look at the txid from the response and see the transaction that burns units.

### Querying for asset holders
One of the advantages of the trivechain protocol is that it allows transparency about asset issuance and transactions. This can be useful for both issuers and users. As a central bank, maybe you wish to see who's holding the currency.

Getting a list of holders of trive Lira is easy:
```
var assetId = 'Your asset Id'

cc.on('connect', function () {
  cc.getStakeHolders(assetId, function (err, body) {
    if (err) return console.error(err)
    console.log("Body: ",body)
  })
})
```
You can use your own Asset ID. You'll get a response like this:
```
Body:  { assetId: 'LRnwHSpUfpQJrbkUHQtSa6r7PVFttyVYMEpRrT',
  holders:
   [ { address: 'FsNtZGAmgrhPJzH37YctHgvgEhJQ2A62ss', amount: 1 },
     { address: 'fYxZYL9nVzmdn5eBJyD18mzjtnyM8joUhS', amount: 494 } ],
  divisibility: 0,
  lockStatus: true,
  aggregationPolicy: 'aggregatable',
  someUtxo: '9ae8d6dda1ee1475db10940438356b4889c41accfeb1e334e7d7a8d598f67ec0:0' }
```
You get a list of addresses holding your asset and number of units being held, and also some general details about the asset.
