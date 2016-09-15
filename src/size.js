module.exports = size

function size (req, res, next) {
  if (typeof req.size !== 'undefined') return next()

  res.size = 0

  var socket
  if (res.socket && res.socket.write) {
    socket = res.socket
  } else if (res.write) {
    socket = res
  }

  if (socket) {
    var realWrite = socket.write.bind(socket)
    socket.write = function write (chunk, encoding, callback) {
      if (typeof chunk === 'string' || chunk instanceof Buffer) res.size += chunk.length
      return realWrite(chunk, encoding, callback)
    }
    var realEnd = socket.end.bind(socket)
    socket.end = function end (chunk, encoding, callback) {
      socket.write = realWrite
      socket.end = realEnd
      if (typeof chunk === 'string' || chunk instanceof Buffer) res.size += chunk.length
      return realEnd(chunk, encoding, callback)
    }
  }
  next()
}
