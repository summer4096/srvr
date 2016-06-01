var createServer = require('http').createServer
var parseUrl = require('url').parse
var assert = require('assert')

module.exports = server

var modules = ['log', 'static', 'size', 'favicon', 'redirect', 'mount', 'router', 'cookie', 'file', 'header']

modules.forEach(function (mod) {
  Object.defineProperty(server, mod, {
    get: require.bind(null, './' + mod)
  })
})

function server (routes, middlewares) {
  assert(Array.isArray(routes), 'server(routes) routes should be array')
  assert(
    typeof middlewares === 'undefined' || Array.isArray(middlewares),
    'server(routes, middlewares) middlewares should be array'
  )

  // router
  var router = server.router(
    routes.slice(),
    middlewares ? middlewares.slice() : [server.log]
  )
  routes = null
  middlewares = null

  // return a server
  var s = createServer(function respond (req, res) {
    req.startTime = process.hrtime()

    req.parsedUrl = parseUrl(req.url, true)
    req.search = req.parsedUrl.search
    req.query = req.parsedUrl.query
    req.pathname = req.parsedUrl.pathname
    res.metadata = []

    router(req, res)
  })

  return s
}
