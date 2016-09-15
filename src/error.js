module.exports = error

function error (code, message) {
  var e = new Error(code + ': ' + message)
  e.statusCode = code
  throw e
}
