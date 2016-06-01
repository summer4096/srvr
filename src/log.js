var size = require('./size')

module.exports = log

function log (req, res, callback) {
  size(req, res, function (err) {
    if (err) return callback(err)

    res.on('finish', write.bind(null, req, res))

    callback()
  })
}

function filesize (bytes) {
  if (bytes >= 1e9) return (Math.round(bytes / 1e7) / 100) + 'GB'
  if (bytes >= 1e6) return (Math.round(bytes / 1e4) / 100) + 'MB'
  if (bytes >= 1e3) return (Math.round(bytes / 10) / 100) + 'KB'
  return bytes + 'B'
}

function write (req, res) {
  var elapsed = process.hrtime(req.startTime)
  elapsed = Math.round(((elapsed[0] * 1000) + (elapsed[1] / 1e6)) * 100) / 100
  var method = req.method.toUpperCase()
  var url = req._originalUrl || req.url
  var statusCode = res.statusCode
  var ip = req.connection.remoteAddress
  var size = filesize(res.size)
  var stack = res.error && (res.error.stack || res.error)
  var line = [method, url, statusCode, ip, elapsed + 'ms', size]
  if (res.metadata && res.metadata.length) line = line.concat(res.metadata)
  if (stack) line.push(stack)
  console.log(line.join(' '))
}
