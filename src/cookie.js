var modRequire = require('./moduleRequire')
var cookie = modRequire('cookie', 'cookie')

module.exports = cookieMiddleware

function setCookie (res, name, value, opts) {
  var serial = cookie.serialize(name, value, opts)
  var header = res.getHeader('Set-Cookie')
  if (typeof header === 'string') {
    res.setHeader('Set-Cookie', [header, serial])
  } else if (Array.isArray(header)) {
    res.setHeader('Set-Cookie', header.concat([serial]))
  } else {
    res.setHeader('Set-Cookie', serial)
  }
}

function cookieMiddleware (req, res) {
  var header = req.headers.cookie
  req.cookies = (typeof header === 'string') ? cookie.parse(header) : {}
  res.cookie = setCookie.bind(null, res)
}
