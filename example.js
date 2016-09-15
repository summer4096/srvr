var srvr = require('./')
var fs = require('fs')

srvr([
  ['GET /', function index (req, res) {
    return 'Hello, World!'
  }],
  ['GET /err', 500],
  ['GET /bradbury', 451],
  ['GET /hello', 'Hellooooo!'],
  ['GET /source.js', function (req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    })
    return fs.createReadStream(__filename, 'utf8')
  }],
  ['GET /return/500', () => 500],
  ['GET /return/404', () => Promise.resolve(404)],
  ['GET /return/hello', () => 'hello'],
  ['GET /uptime', () => `server has been up for ${process.uptime()} seconds`],
  srvr.static('/d', './data'),
  ['GET /api', () => [{hello: 'world'}]],
  ['GET /api/random', () => ({ rand: Math.random() })],
  [/^GET \/fancy\/(.+)$/,
    function (req, res) { res.writeHead(200, {'Content-Type': 'text/html'}) },
    (req) => `<b>What's up, ${req.params[0]}?</b>`
  ],
  ['GET /google', srvr.redirect('https://google.com/')],
  ['GET /fancy404', 404, 'AYYYY LMAO'],
  ['GET /cookies', srvr.cookie, function (req, res) {
    res.cookie('SecretValue', req.cookies.SecretValue ? (Number(req.cookies.SecretValue) + 1) : 1)
    return req.headers.cookie || 'no cookies'
  }],
  ['GET /readme', srvr.file('README.md')],
  ['GET /readme-download', srvr.file.download('README.md')]
], [
  srvr.log,
  srvr.header('X-Server-Name', 'SRVR 1.0')
]).listen(8080)
