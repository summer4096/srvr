module.exports = length

function length (req, res, next) {
  if (typeof req.length !== 'undefined') return next()

  res.length = 0
  if (res.socket && res.socket.write) {
    var socket = res.socket
    var realWrite = socket.write.bind(socket)
    socket.write = function write (chunk, encoding, callback) {
      if (typeof chunk === 'string' || chunk instanceof Buffer) res.length += chunk.length
      return realWrite(chunk, encoding, callback)
    }
    var realEnd = socket.end.bind(socket)
    socket.end = function end (chunk, encoding, callback) {
      socket.write = realWrite
      socket.end = realEnd
      if (typeof chunk === 'string' || chunk instanceof Buffer) res.length += chunk.length
      return realEnd(chunk, encoding, callback)
    }
  }
  next()
}
