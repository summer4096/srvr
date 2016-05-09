var basename = require('path').basename
var modRequire = require('./moduleRequire')
var send = modRequire('file', 'send')

module.exports = file

function file (path, options) {
  return function sendFile (req, res, callback) {
    var s = send(req, path, options)
    s.on('error', callback.bind(null))

    if (options && options.download) {
      var name = typeof options.download === 'string' ? options.download : basename(path)
      name = name.replace(/\\([\s\S])|(")/g, '\\$1$2')
      s.on('headers', function sendContentDisposition () {
        res.setHeader('Content-Disposition', 'attachment; filename="' + name + '";')
      })
    }

    s.pipe(res)
      .on('error', callback.bind(null))
      .on('finish', callback.bind(null, null))
  }
}

file.download = function fileDownload (path, options) {
  options = options || {}
  options.download = true

  return file(path, options)
}
