const bip39 = require('bip39');
const Bitcoinjs = require('bitcoinjs-lib');
const Trivechaincore = require('@trivechain/trivechaincore-lib');
const { Address, Networks, PublicKey, Mnemonic } = Trivechaincore;

const { mnemonicSchema } = require('./lib/validation');


// P2PK
const getAddress = async (args) => {
    try {
        const params = await mnemonicSchema.validateAsync(args);

        const mnemonic = new Mnemonic(params.mnemonicStr);

        const xprivateKey = mnemonic.toHDPrivateKey("", Networks[params.network]);

        const privateKey = xprivateKey.derive(`m/44\'/${params.mnemonicAccount}\'/${params.mnemonicIndex}\'/0/0`).privateKey;

        const publicKey = new PublicKey(privateKey, Networks[params.network]);

        const address = new Address(publicKey, Networks[params.network]);

        return address.toString()
    } catch (err) {
        return err
    }
}

// P2SH
const getScriptAddress = async (args) => {
    try {
        const params = await mnemonicSchema.validateAsync(args);

        const mnemonic = new Mnemonic(params.mnemonicStr);

        const xprivateKey = mnemonic.toHDPrivateKey("", Networks[params.network]);

        const privateKey = xprivateKey.derive(`m/44\'/${params.mnemonicAccount}\'/${params.mnemonicIndex}\'/0/0`).privateKey;

        const publicKey = new PublicKey(privateKey, Networks[params.network]);

        const publicKeys = [
            publicKey
        ];

        const requiredSignatures = 1;

        const address = new Address(publicKeys, requiredSignatures);

        return address.toString()
    } catch (err) {
        return err
    }
}

// Private Key
const getAddressPrivateKey = async (args) => {
    try {
        const params = await mnemonicSchema.validateAsync(args);

        const mnemonic = new Mnemonic(params.mnemonicStr);

        const xprivateKey = mnemonic.toHDPrivateKey("", Networks[params.network]);

        const privateKey = xprivateKey.derive(`m/44\'/${params.mnemonicAccount}\'/${params.mnemonicIndex}\'/0/0`).privateKey;

        return privateKey.toWIF()
    } catch (err) {
        throw new Error(err)
    }
}

//
//
// Deprecated function to support v1 -> v2 transition
//
// Should migrate as soon as possible as it will no longer be supported
//
//
//


const DEPRECATED_testnet = {
    messagePrefix: '\x18Trivechain Signed Message:\n',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x7f,
    scriptHash: 0x7d,
    wif: 0xef,
    dustThreshold: 546,
    feePerKb: 10000
  }
  
  const DEPRECATED_mainnet = {
    messagePrefix: '\x18Trivechain Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x41,
    scriptHash: 0x12,
    wif: 0xcc,
    dustThreshold: 546, // core.h
    feePerKb: 10000, // main.cpp
  }

// DEPRECATED P2PK
const DEPRECATED_getAddress = async (args) => {
    try {
        const params = await mnemonicSchema.validateAsync(args);

        const privateSeed = await bip39.mnemonicToSeed(params.mnemonicStr)
        let master = await Bitcoinjs.HDNode.fromSeedHex(privateSeed, params.network === "mainnet" ? DEPRECATED_mainnet : DEPRECATED_testnet)
        master = master.deriveHardened(44)
        // coin_type'
        master = master.deriveHardened(0)
        // account'
        master = master.deriveHardened(params.mnemonicAccount)
        // no change
        master = master.derive(0)
        // address_index
        master = master.derive(params.mnemonicIndex)

        return master.getAddress()
    } catch (err) {
        return err
    }
}

// DEPRECATED getAddressPrivateKey
const DEPRECATED_getAddressPrivateKey = async (args) => {
    try {
        const params = await mnemonicSchema.validateAsync(args);
        
        const privateSeed = await bip39.mnemonicToSeed(params.mnemonicStr)
        let master = await Bitcoinjs.HDNode.fromSeedHex(privateSeed, params.network === "mainnet" ? DEPRECATED_mainnet : DEPRECATED_testnet)
        master = master.deriveHardened(44)
        // coin_type'
        master = master.deriveHardened(0)
        // account'
        master = master.deriveHardened(params.mnemonicAccount)
        // no change
        master = master.derive(0)
        // address_index
        master = master.derive(params.mnemonicIndex)

        return master.keyPair.toWIF()
    } catch (err) {
        return err
    }
}

module.exports = {
    getAddress,
    getScriptAddress,
    getAddressPrivateKey,
    DEPRECATED_getAddress,
    DEPRECATED_getAddressPrivateKey
}