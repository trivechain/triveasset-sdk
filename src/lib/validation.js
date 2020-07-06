const Joi = require('@hapi/joi');
// https://medium.com/@rossbulat/joi-for-node-exploring-javascript-object-schema-validation-50dd4b8e1b0f

exports.sendBuildAssetTXSchema = Joi.object({
  from: Joi.array().items(Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/).required()),
  utxos: Joi.array().items(Joi.object().required()),
  to: Joi.array().items(
    Joi.object({
      address: Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/).required(),
      amount: Joi.number().required().integer().min(1),
      assetId: Joi.string().pattern(/^[LU][1-9A-HJ-NP-Za-km-z]{37}$/).required()
    })).required(),
  privateKey: Joi.array().items(Joi.string().length(52).required()).optional(),
  financeChangeAddress: Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/).required(),
  coloredChangeAddress: Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/),
  metadata: Joi.object().optional(),
  transmit: Joi.bool().default(true).optional(),
  network: Joi.string().lowercase().valid('mainnet', 'testnet', 'livenet').default('mainnet').optional()
})
  .xor('from', 'utxos')
  .nand('utxos', 'coloredChangeAddress')
  .and('from', 'coloredChangeAddress');

exports.buildIssueAssetTXSchema = Joi.object({
  utxos: Joi.array().items(Joi.object().required()),
  amount: Joi.number().required().integer().min(1).max(9007199254740991),
  divisibility: Joi.number().required().integer().min(0).max(15),
  lockStatus: Joi.bool().required(),
  fee: Joi.number().integer().optional(),
  metadata: Joi.object({
    assetName: Joi.string().required(),
    assetSymbol: Joi.string().required(),
    issuer: Joi.string().optional(),
    description: Joi.string().optional(),
    userData: Joi.object().optional(),
    urls: Joi.array().optional(),
  }).required(),
  issueAddress: Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/).required(),
  financeChangeAddress: Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/).required(),
  privateKey: Joi.array().items(Joi.string().length(52).required()).optional(),
  transmit: Joi.bool().default(true).optional(),
  network: Joi.string().lowercase().valid('mainnet', 'testnet', 'livenet').default('mainnet').optional()
})

exports.utxoConsolidationSchema = Joi.object({
  from: Joi.array().items(Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/).required()).required(),
  assetId: Joi.string().pattern(/^[LU][1-9A-HJ-NP-Za-km-z]{37}$/).required(),
  privateKey: Joi.array().items(Joi.string().length(52).required()).optional(),
  financeChangeAddress: Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/).required(),
  coloredChangeAddress: Joi.string().pattern(/^[T8ts][1-9A-HJ-NP-Za-km-z]{33}$/).required(),
  metadata: Joi.object().optional(),
  transmit: Joi.bool().default(true).optional(),
  network: Joi.string().lowercase().valid('mainnet', 'testnet', 'livenet').default('mainnet').optional()
});

exports.mnemonicSchema = Joi.object({
  mnemonicStr: Joi.string().pattern(/^([a-zA-Z0-9]* ){11}[a-zA-Z0-9]*$/).required(),
  mnemonicAccount: Joi.number()
    .integer()
    .min(0)
    .max(1000000).required(),
  mnemonicIndex: Joi.number()
    .integer()
    .min(0)
    .max(10000000).required(),
  network: Joi.string().lowercase().valid('mainnet', 'testnet', 'livenet').default('mainnet').optional()
});
