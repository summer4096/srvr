module.exports = redirect

function redirect (location, code) {
  return function sendRedirect (req, res, callback) {
    res.metadata.push('redirect → ' + location)
    res.writeHead(code || 302, {
      Location: location
    })
    res.end(callback)
  }
}
