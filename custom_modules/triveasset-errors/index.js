var errors = require('./lib/errors.js')
errors.errorHandler = require('./lib/errorHandler.js')
errors.generateDocs = require('./lib/generateDocs.js')

module.exports = errors
