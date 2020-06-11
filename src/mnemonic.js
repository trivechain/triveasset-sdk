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

module.exports = {
    getAddress,
    getScriptAddress,
    getAddressPrivateKey
}