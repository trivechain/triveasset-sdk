var errors = require('./errors')
var _ = require('lodash')
var debug = require('debug')('errors:errorHandler')

var INTERNAL_SERVER_ERROR = 'Internal server error'

module.exports = function (options) {
  options = options || {}
  var env = (options.env || process.env.NODE_ENV)
  var log = options.log || true
  if (typeof log !== 'function' && typeof log !== 'boolean') {
    throw new TypeError('option log must be function or boolean')
  }
  if (log === true) {
    log = console.error
  }

  return function errorHandler (err, req, res, next) {
    var error
    if (err instanceof errors.ColoredCoinsError) {
      debug('ColoredCoinsError: err = ', err)
      error = toJSON(err)
      if (env === 'development') {
        error.stack = err.stack
      }
    } else if (_.isArray(err)) {
      debug('Array: err = ', err)
      error = {
        message: err[0],
        status: err[1]
      }
    } else if (_.isString(err)) {
      debug('String: err = ', err)
      error = {
        message: err,
        status: 500
      }
    } else if (_.isError(err)) {
      debug('Error: err = ', err)
      error = {
        message: INTERNAL_SERVER_ERROR,
        status: 500
      }
      if (env === 'development') {
        error.original = err
        error.stack = err.stack
      }
    } else if (_.isObject(err)) {
      debug('Object: err = ', err)
      error = err
    } else {
      error = {
        message: INTERNAL_SERVER_ERROR,
        status: 500
      }
    }

    !error.requestId && req.headers && req.headers['request-id'] && (error.requestId = req.headers['request-id'])
    req.headers && req.headers['correlation-id'] && (error.correlationId = req.headers['correlation-id'])
    req.headers && req.headers['remote-id'] && (error.remoteId = req.headers['remote-id'])
    if (env === 'development' && !error.stack) {
      error.stack = ''
      Error.captureStackTrace(error, errorHandler)
    }

    log(error)
    res.status(error.status || 500)
    return res.send(error)
  }
}

function toJSON (err) {
  if (err.toJSON) {
    return err.toJSON()
  }

  var json = {}
  for (var prop in err) {
    json[prop] = err[prop]
  }
  return json
}
