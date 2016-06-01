module.exports = mount

function startsWith (str, sub) {
  return str.slice(0, sub.length) === sub
}

function mount (base, serve) {
  if (!startsWith(base, '/')) {
    base = '/' + base
  }

  var matcher = {
    exec: function (route) {
      return startsWith(route.replace(/^[a-z]+ /i, ''), base) ? [] : null
    }
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
