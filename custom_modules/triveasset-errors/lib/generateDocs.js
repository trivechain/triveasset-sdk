module.exports = function generateDocs (errors, destinationFile, callback) {
  var table = require('markdown-table')
  var fs = require('fs')
  var json = [['Error Code', 'Message']]
  var codes = errors.codes
  Object.keys(codes).forEach(function (code) {
    if (!codes[code].defaultMessage) {
      return
    }
    json.push([codes[code].code, codes[code].defaultMessage])
  })
  fs.writeFile(destinationFile, table(json), callback)
}
