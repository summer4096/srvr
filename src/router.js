var assert = require('assert')
var ServerResponse = require('http').ServerResponse
var statusCodes = require('./statusCodes')

module.exports = router

function router (routes, middlewares) {
  var exactRoutes = {}
  var fuzzyRoutes = []
  var websocketExactRoutes = {}
  var websocketFuzzyRoutes = []
  var codeRoutes = {}
  middlewares = middlewares || []

  // parse routes
  for (var i = 0; i < routes.length; i++) {
    var route = routes[i]
    try {
      assert(Array.isArray(route), 'should be array')
      var path = route[0]
      var responder = route.slice(1)

      if (typeof responder[0] === 'object' && typeof responder[0].handleUpgrade === 'function') {
        // websocket support
        assert.equal(responder.length, 1, 'websocket endpoints should only have one responder')
        if (typeof path === 'string') {
          websocketExactRoutes[path] = responder
        } else if (typeof path === 'object' && typeof path.exec === 'function') {
          websocketFuzzyRoutes.push(route)
        } else {
          throw new Error('Invalid websocket route: expected first element to be string or regex')
        }
      } else if (typeof path === 'string') {
        exactRoutes[path] = responder
      } else if (typeof path === 'number') {
        codeRoutes[path] = responder
      } else if (typeof path === 'object' && typeof path.exec === 'function') {
        fuzzyRoutes.push(route)
      } else {
        throw new Error('Invalid route: expected first element to be string, number, or regex')
      }
    } catch (err) {
      err.message = (
        'Error parsing routes[' + i + '] ' +
        typeof route + ' ' + route + '\n' + err.message
      )
      throw err
    }
  }

  for (var j = 0; j < middlewares.length; j++) {
    try {
      middlewares[j] = middlewares[j]
    } catch (err) {
      err.message = (
        'Error parsing middlewares[' + j + '] ' +
        typeof middlewares[j] + ' ' + middlewares[j] + '\n' + err.message
      )
      throw err
    }
  }

  return function routeRequest (req, res, isWebsocket, upgradeHead) {
    var route = req.method.toUpperCase() + ' ' + req.parsedUrl.pathname

    var match
    try {
      var protocolRoutes = isWebsocket ? {
        exact: websocketExactRoutes,
        fuzzy: websocketFuzzyRoutes
      } : {
        exact: exactRoutes,
        fuzzy: fuzzyRoutes
      }

      // look for exact matches
      if (protocolRoutes.exact[route]) {
        match = protocolRoutes.exact[route]
      } else {
        // look for regex matches
        var hit
        for (var k = 0; k < protocolRoutes.fuzzy.length; k++) {
          var fuzzyRoute = protocolRoutes.fuzzy[k]
          var params = fuzzyRoute[0].exec(route)
          if (params) {
            hit = true
            req.params = params.slice(1)
            match = fuzzyRoute.slice(1)
            break
          }
        }
        // give up and 404
        if (!hit) match = [404]
      }

      if (isWebsocket) {
        if (match[0] === 404) {
          res.end()
        } else {
          match[0].handleUpgrade(req, res, upgradeHead)
        }
        return
      }

      consume(middlewares.concat(match), req, res, codeRoutes, function onConsumeFinished (err) {
        if (err) {
          res.error = err
          sendError(req, res, err, codeRoutes)
        } else if (res.statusCode && !res.headersSent) {
          var message = statusCodes[res.statusCode] || ('Invalid status code ' + res.statusCode)
          sendError(req, res, null, codeRoutes, res.statusCode, message)
        }
      })
    } catch (err) {
      // handle sync errors
      res.error = err
      sendError(req, res, err, codeRoutes)
    }
  }
}

function consume (item, req, res, codeRoutes, callback, i, err, result) {
  if (err) return callback(err)
  if (result) return consume(result, req, res, codeRoutes, callback)

  try {
    var type = typeof item
    if (type === 'undefined' || item === null) {
      return callback()
    }

    var next = consume.bind(null, null, req, res, codeRoutes, callback, null)

    if (type === 'object' && typeof item.pipe === 'function') {
      item
        .on('error', callback)
        .pipe(res)
        .on('error', callback)
        .on('close', callback.bind(null, null))
        .on('finish', callback.bind(null, null))
    } else if (type === 'number') {
      res.statusCode = item
      callback()
    } else if (type === 'string' || item instanceof Buffer) {
      if (type === 'string') item = Buffer.from(item, 'utf8')
      if (!res.headersSent) {
        res.writeHead(res.statusCode || 200, {
          'Content-Type': res.getHeader('Content-Type') || 'text/plain; charset=UTF-8'
        })
      }
      res.end(item, callback)
    } else if (type === 'function') {
      if (item.length >= 3) {
        item(req, res, next)
      } else {
        var returnVal = item(req, res)
        if (typeof returnVal === 'object' && typeof returnVal.then === 'function') {
          returnVal.then(next.bind(null, null)).catch(next)
        } else {
          next(null, returnVal)
        }
      }
    } else if (Array.isArray(item)) {
      if (i === item.length) {
        callback()
      } else {
        i = i || 0
        var iterate = consume.bind(null, item, req, res, codeRoutes, callback, i + 1)
        consume(item[i], req, res, codeRoutes, iterate)
      }
    } else if (type === 'object') {
      var json = JSON.stringify(item)
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=UTF-8')
      }
      next(null, json)
    }
  } catch (err) {
    callback(err)
  }
}

function sendError (req, res, err, codeRoutes, code, message) {
  // bail out on websockets
  if (!(res instanceof ServerResponse)) {
    res.end()
    return
  }

  if (typeof err === 'object' && err !== null) {
    code = err.statusCode || 500
    message = err.stack || err
  }
  if (codeRoutes[code]) {
    consume(codeRoutes[code], req, res, {}, function (err) {
      if (err) sendError(req, res, err, {})
    })
  } else {
    if (!res.headersSent) {
      res.writeHead(code, {
        'Content-Type': 'text/plain; charset=UTF-8'
      })
    }
    res.end(message)
  }
}
