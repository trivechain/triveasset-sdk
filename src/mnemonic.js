const Trivechaincore = require('@trivechain/trivechaincore-lib');
const { Address, Networks, PublicKey, Mnemonic } = Trivechaincore;

// P2PK
const getAddress = (mnemonicStr, mnemonicAccount, mnemonicIndex) => {
    const mnemonic = new Mnemonic(mnemonicStr);

    const xprivateKey = mnemonic.toHDPrivateKey("", Networks.livenet);

    const privateKey = xprivateKey.derive(`m/44\'/${mnemonicAccount}\'/${mnemonicIndex}\'/0/0`).privateKey;

    const publicKey = new PublicKey(privateKey, Networks.livenet);

    const address = new Address(publicKey, Networks.livenet);

    return address.toString()
}

// P2SH
const getScriptAddress = (mnemonicStr, mnemonicAccount, mnemonicIndex) => {
    const mnemonic = new Mnemonic(mnemonicStr);

    const xprivateKey = mnemonic.toHDPrivateKey("", Networks.livenet);

    const privateKey = xprivateKey.derive(`m/44\'/${mnemonicAccount}\'/${mnemonicIndex}\'/0/0`).privateKey;

    const publicKey = new PublicKey(privateKey, Networks.livenet);

    const publicKeys = [
        publicKey
    ];

    const requiredSignatures = 1;

    const address = new Address(publicKeys, requiredSignatures);

    return address.toString()
}

// Private Key
const getAddressPrivateKey = (mnemonicStr, mnemonicAccount, mnemonicIndex) => {
    const mnemonic = new Mnemonic(mnemonicStr);

    const xprivateKey = mnemonic.toHDPrivateKey("", Networks.livenet);

    const privateKey = xprivateKey.derive(`m/44\'/${mnemonicAccount}\'/${mnemonicIndex}\'/0/0`).privateKey;

    return privateKey.toWIF()
}

module.exports = {
    getAddress,
    getScriptAddress,
    getAddressPrivateKey
}