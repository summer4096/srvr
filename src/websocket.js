var moduleRequire = require('./moduleRequire')
var ws = moduleRequire('websocket', 'ws')

module.exports = websocket

function websocket (responder) {
  var server = new ws.Server({ noServer: true })

  return {
    handleUpgrade: function handleUpgrade (req, socket, upgradeHead) {
      server.handleUpgrade(req, socket, upgradeHead, responder.bind(null, req))
    }
  }
}
