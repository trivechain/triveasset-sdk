var errors = require('errors')
var originalCreate = errors.create
errors.codes = exports.codes = {}

// ColoredCoins base error (all errors will inherit from it)
errors.create({
  name: 'ColoredCoinsError'
})

errors.create = function (options) {
  // make 'code' and 'name' mandatory
  if (!options.name) throw new Error('Must specify name')
  if (!options.code) throw new Error('Must specify code')
  if (typeof options.code !== 'number') throw new Error('code must be a number')
  if (errors.find(options.code)) throw new Error('code already exists')
  options.parent = options.parent || errors.ColoredCoinsError
  errors.codes[options.code] = options
  return originalCreate(options)
}

// validation errors

errors.create({
  name: 'ValidationError',
  code: 10000,
  status: 400,
  defaultMessage: 'Validation error'
})

// block-explorer errors

errors.create({
  name: 'ResolutionTooHighError',
  code: 11001,
  status: 500,
  defaultMessage: 'Sample resolution too high'
})

errors.create({
  name: 'BlocksRangeTooHighError',
  code: 11002,
  status: 500,
  defaultMessage: 'Requested blocks range is too high'
})

// coloredcoinsd errors

errors.create({
  name: 'CCTransactionConstructionError',
  code: 20000,
  defaultMessage: 'Colored transaction construction has failed'
})

errors.create({
  name: 'OutputAlreadySpentError',
  code: 20001,
  defaultMessage: 'Output is already spent'
})

errors.create({
  name: 'NoOutputWithSuchAssetError',
  code: 20002,
  defaultMessage: 'No output with the requested asset'
})

errors.create({
  name: 'NotEnoughFundsError',
  code: 20003,
  defaultMessage: 'Not enough satoshi to cover transaction'
})

errors.create({
  name: 'NotEnoughAssetsError',
  code: 20004,
  defaultMessage: 'Not enough assets to cover transfer transaction'
})

errors.create({
  name: 'MissingIssuanceTxidError',
  code: 20005,
  defaultMessage: 'Missing issuanceTxid for utxo',
  defaultResponse: 'Check that the utxo is carrying assets'
})

errors.create({
  name: 'SeedMetadataError',
  code: 20011,
  defaultMessage: 'Metadata seed has failed'
})

errors.create({
  name: 'DownloadMetadataError',
  code: 20012,
  defaultMessage: 'Metadata download has failed'
})

errors.create({
  name: 'UploadMetadataError',
  code: 20013,
  defaultMessage: 'Metadata upload has failed'
})

errors.create({
  name: 'MetadataMissingShaError',
  code: 20014,
  defaultMessage: 'Metadata is missing sha1 or sha2 - can\'t issue'
})

module.exports = errors
