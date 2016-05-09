module.exports = mount

function mount (base, serve) {
  if (!base.startsWith('/')) {
    base = '/' + base
  }

  var matcher = {
    exec: (route) => route.replace(/^[a-z]+ /i, '').startsWith(base) ? [] : null
  }

  return [matcher, function (req, res, callback) {
    delete req.parsedUrl
    delete req.search
    delete req.query
    delete req.pathname
    req._originalUrl = req.url
    req.url = req.url.slice(base.length)
    if (req.url[0] !== '/') req.url = '/' + req.url
    serve(req, res, callback)
  }]
}
