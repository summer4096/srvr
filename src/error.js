module.exports = error

function error (code, message) {
  let e = new Error(code + ': ' + message)
  e.statusCode = code
  throw e
}
