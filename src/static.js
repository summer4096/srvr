var mount = require('./mount')
var modRequire = require('./moduleRequire')
var serveStatic = modRequire('static', 'serve-static')

module.exports = createStaticMount

function createStaticMount (url, root, options) {
  options = options || {}
  if (typeof options.fallthrough === 'undefined') {
    options.fallthrough = false
  }
  return mount(url, serveStatic(root || url, options))
}
