var test = require('tape')
var req = require('supertest')
var WebSocket = require('ws')
var joinPath = require('path').join
var srvr = require('..')
var readFileSync = require('fs').readFileSync

var readme = readFileSync(joinPath(__dirname, '../README.md'), 'utf8')

test('smoke', function (t) {
  var app = srvr([], [])

  req(app).get('/').expect(404).end(t.end)
})

test('behavior', function (mainTest) {
  var incomprehensibleError = new Error('wat')

  var testApp = srvr([
    ['GET /', function index (req, res) {
      return 'Hello, World!'
    }],
    ['GET /err', 500],
    ['GET /bradbury', 451, 'sweet reference, bro'],
    ['GET /hello', 'Hellooooo!'],
    ['GET /return/500', function () { return 500 }],
    ['GET /return/404', function () { return Promise.resolve(404) }],
    ['GET /return/makething', 201, function () { return 'makething' }],
    srvr.static('/src', joinPath(__dirname, '../src')),
    ['GET /api', {hello: 'world'}],
    ['GET /api/random', function () { return { rand: Math.random() } }],
    [/^GET \/fancy\/(.+)$/,
      srvr.header('Content-Type', 'text/html'),
      function (req) { return '<b>What\'s up, ' + req.params[0] + '?</b>' }
    ],
    ['GET /google', srvr.redirect('https://google.com/')],
    ['GET /cookies', srvr.cookie, function (req, res) {
      res.cookie('SecretValue', req.cookies.SecretValue ? (Number(req.cookies.SecretValue) + 1) : 1)
      return Object.keys(req.cookies).length ? req.cookies : 'no cookies'
    }],
    ['GET /readme', srvr.file('README.md')],
    ['GET /readme-download', srvr.file.download('README.md')],
    ['GET /incomprehensible', 501],
    [500, 'it is broken :('],
    [501, function () { throw incomprehensibleError }],
    ['GET /websocket', srvr.websocket(function onConn (req, client) {
      client.send(req.headers.websocket_test)
      client.on('message', (d) => client.send(d))
    })]
  ], [])

  function subtest (name, fn) {
    mainTest.test(name, function (t) {
      fn(req(testApp)).end(function (err) {
        t.error(err, 'should not fail')
        t.end()
      })
    })
  }

  subtest('GET /', function (app) {
    return app.get('/')
      .expect(200, 'Hello, World!')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', 'Hello, World!'.length)
  })

  subtest('GET /err', function (app) {
    return app.get('/err')
      .expect(500, 'it is broken :(')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', 'it is broken :('.length)
  })

  subtest('GET /bradbury', function (app) {
    return app.get('/bradbury')
      .expect(451, 'sweet reference, bro')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', 'sweet reference, bro'.length)
  })

  subtest('GET /hello', function (app) {
    return app.get('/hello')
      .expect(200, 'Hellooooo!')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', 'Hellooooo!'.length)
  })

  subtest('GET /return/500', function (app) {
    return app.get('/return/500')
      .expect(500, 'it is broken :(')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', 'it is broken :('.length)
  })

  subtest('GET /return/404', function (app) {
    return app.get('/return/404')
      .expect(404, 'Not Found')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', 'Not Found'.length)
  })

  subtest('GET /return/makething', function (app) {
    return app.get('/return/makething')
      .expect(201, 'makething')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', 'makething'.length)
  })

  subtest('GET /src/index.js', function (app) {
    return app.get('/src/index.js')
      .expect(200, /module\.exports/)
      .expect('Content-Type', 'application/javascript')
      .expect('Content-Length', /^[0-9]+$/)
  })

  subtest('GET /api/random', function (app) {
    return app.get('/api/random')
      .expect(200, /^{"rand":0\.[0-9]+}$/)
      .expect('Content-Type', 'application/json')
      .expect('Content-Length', /^[0-9]+$/)
  })

  subtest('GET /fancy/person', function (app) {
    return app.get('/fancy/person')
      .expect(200, '<b>What\'s up, person?</b>')
      .expect('Content-Type', 'text/html')
      .expect('Content-Length', '<b>What\'s up, person?</b>'.length)
  })

  subtest('GET /google', function (app) {
    return app.get('/google')
      .expect(302, '')
      .expect('Location', 'https://google.com/')
  })

  subtest('GET /cookies', function (app) {
    return app.get('/cookies')
      .expect(200, 'no cookies')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', 'no cookies'.length)
      .expect('Set-Cookie', 'SecretValue=1')
  })

  subtest('GET /cookies (set)', function (app) {
    return app.get('/cookies')
      .set('Cookie', 'SecretValue=5')
      .expect(200, '{"SecretValue":"5"}')
      .expect('Content-Type', 'application/json')
      .expect('Content-Length', '{"SecretValue":"5"}'.length)
      .expect('Set-Cookie', 'SecretValue=6')
  })

  subtest('GET /readme', function (app) {
    return app.get('/readme')
      .expect(200, readme)
      .expect('Content-Type', 'text/x-markdown; charset=UTF-8')
      .expect('Content-Length', readme.length)
  })

  subtest('GET /readme-download', function (app) {
    return app.get('/readme-download')
      .expect(200, readme)
      .expect('Content-Type', 'text/x-markdown; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="README.md";')
      .expect('Content-Length', readme.length)
  })

  subtest('GET /incomprehensible', function (app) {
    return app.get('/incomprehensible')
      .expect(500, incomprehensibleError.stack)
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', incomprehensibleError.stack.length)
  })

  mainTest.test('GET /websocket', function (t) {
    var addr = testApp.address()
    var port

    if (!addr) testApp.listen(0)
    port = testApp.address().port

    var url = 'ws://127.0.0.1:' + port + '/websocket'

    var socket = new WebSocket(url, {
      headers: {
        websocket_test: 'beep boop'
      }
    })

    t.plan(4)

    var saidHello = false

    socket.on('open', () => t.pass('open'))
    socket.on('message', (data) => {
      if (!saidHello) {
        t.equal(data, 'beep boop', 'header')
        saidHello = true
        socket.send('bip bap')
      } else {
        t.equal(data, 'bip bap', 'echo')
        socket.close()
        testApp.close(() => t.pass('close'))
      }
    })
  })
})
