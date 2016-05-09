var test = require('tape')
var req = require('supertest')
var srvr = require('..')
var readFileSync = require('fs').readFileSync

var readme = readFileSync(`${__dirname}/../README.md`, 'utf8')

function shouldPass (t, msg) {
  return function (err) {
    t.error(err, msg)
  }
}

test('smoke', function (t) {
  var app = srvr([], [])

  req(app).get('/').expect(404).end(t.end)
})

test('behavior', function (t) {
  var app = srvr([
    ['GET /', function index (req, res) {
      return 'Hello, World!'
    }],
    ['GET /err', 500],
    ['GET /bradbury', 451, 'sweet reference, bro'],
    ['GET /hello', 'Hellooooo!'],
    ['GET /return/500', () => 500],
    ['GET /return/404', () => Promise.resolve(404)],
    ['GET /return/makething', 201, () => 'makething'],
    srvr.static('/src', `${__dirname}/../src`),
    ['GET /api', {hello: 'world'}],
    ['GET /api/random', () => ({ rand: Math.random() })],
    [/^GET \/fancy\/(.+)$/,
      srvr.header('Content-Type', 'text/html'),
      (req) => `<b>What's up, ${req.params[0]}?</b>`
    ],
    ['GET /google', srvr.redirect('https://google.com/')],
    ['GET /cookies', srvr.cookie, function (req, res) {
      res.cookie('SecretValue', req.cookies.SecretValue ? (Number(req.cookies.SecretValue) + 1) : 1)
      return Object.keys(req.cookies).length ? req.cookies : 'no cookies'
    }],
    ['GET /readme', srvr.file('README.md')],
    ['GET /readme-download', srvr.file.download('README.md')]
  ], [])

  t.plan(15)

  req(app)
    .get('/')
    .expect(200, 'Hello, World!')
    .expect('Content-Type', 'text/plain')
    .expect('Content-Length', 'Hello, World!'.length)
    .end(shouldPass(t, 'GET /'))

  req(app)
    .get('/err')
    .expect(500, 'Internal Server Error')
    .expect('Content-Type', 'text/plain')
    .expect('Content-Length', 'Internal Server Error'.length)
    .end(shouldPass(t, 'GET /err'))

  req(app)
    .get('/bradbury')
    .expect(451, 'sweet reference, bro')
    .expect('Content-Type', 'text/plain')
    .expect('Content-Length', 'sweet reference, bro'.length)
    .end(shouldPass(t, 'GET /bradbury'))

  req(app)
    .get('/hello')
    .expect(200, 'Hellooooo!')
    .expect('Content-Type', 'text/plain')
    .expect('Content-Length', 'Hellooooo!'.length)
    .end(shouldPass(t, 'GET /hello'))

  req(app)
    .get('/return/500')
    .expect(500, 'Internal Server Error')
    .expect('Content-Type', 'text/plain')
    .expect('Content-Length', 'Internal Server Error'.length)
    .end(shouldPass(t, 'GET /return/500'))

  req(app)
    .get('/return/404')
    .expect(404, 'Not Found')
    .expect('Content-Type', 'text/plain')
    .expect('Content-Length', 'Not Found'.length)
    .end(shouldPass(t, 'GET /return/404'))

  req(app)
    .get('/return/makething')
    .expect(201, 'makething')
    .expect('Content-Type', 'text/plain')
    .expect('Content-Length', 'makething'.length)
    .end(shouldPass(t, 'GET /return/makething'))

  req(app)
    .get('/src/index.js')
    .expect(200, /module\.exports/)
    .expect('Content-Type', 'application/javascript')
    .expect('Content-Length', /^[0-9]+$/)
    .end(shouldPass(t, 'GET /src/index.js'))

  req(app)
    .get('/api/random')
    .expect(200, /^{"rand":0\.[0-9]+}$/)
    .expect('Content-Type', 'application/json')
    .expect('Content-Length', /^[0-9]+$/)
    .end(shouldPass(t, 'GET /api/random'))

  req(app)
    .get('/fancy/person')
    .expect(200, '<b>What\'s up, person?</b>')
    .expect('Content-Type', 'text/html')
    .expect('Content-Length', '<b>What\'s up, person?</b>'.length)
    .end(shouldPass(t, 'GET /fancy/person'))

  req(app)
    .get('/google')
    .expect(302, '')
    .expect('Location', 'https://google.com/')
    .end(shouldPass(t, 'GET /google'))

  req(app)
    .get('/cookies')
    .expect(200, 'no cookies')
    .expect('Content-Type', 'text/plain')
    .expect('Content-Length', 'no cookies'.length)
    .expect('Set-Cookie', 'SecretValue=1')
    .end(shouldPass(t, 'GET /cookies (without cookies)'))

  req(app)
    .get('/cookies')
    .set('Cookie', 'SecretValue=5')
    .expect(200, '{"SecretValue":"5"}')
    .expect('Content-Type', 'application/json')
    .expect('Content-Length', '{"SecretValue":"5"}'.length)
    .expect('Set-Cookie', 'SecretValue=6')
    .end(shouldPass(t, 'GET /cookies (with cookies)'))

  req(app)
    .get('/readme')
    .expect(200, readme)
    .expect('Content-Type', 'text/x-markdown; charset=UTF-8')
    .expect('Content-Length', readme.length)
    .end(shouldPass(t, 'GET /readme'))

  req(app)
    .get('/readme-download')
    .expect(200, readme)
    .expect('Content-Type', 'text/x-markdown; charset=UTF-8')
    .expect('Content-Disposition', 'attachment; filename="README.md";')
    .expect('Content-Length', readme.length)
    .end(shouldPass(t, 'GET /readme-download'))
})
