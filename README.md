# srvr

a little http server

 * everything express does
 * better
 * less code
 * no dependencies

```console
npm install --save srvr
```

#### srvr(*Array* **routes**[, *Array* **middleware**])

```js
import srvr from 'srvr'
import bodyParser from 'body-parser'

let app = srvr([

  ['GET /', 'Hello, World!'],

  [/^GET \/posts\/([0-9]+)$/, (req) => lookupPost(req.params[0])],

  ['POST /comments', bodyParser.json(), async function (req, res) {
    try {
      await saveComment(req.body.content)
      return 'thank you for commenting'
    } catch (err) {
      throw srvr.error(400, 'your comment is bad and you should feel bad')
    }
  }]

])

app.listen(8080)
```

## JSON APIs

return an object or array to send a JSON response

```js
let app = srvr([
  ['GET /api/hello-world', function (req, res) {
    return {hello: 'world!'}
  }]
])
```

## regex routes

any capture groups will be put into req.params

```js
let app = srvr([
  [/^(POST|PATCH) \/posts\/([0-9]+)$/, function (req, res) {
    req.params // ['PATCH', '42']
  }]
])
```

## status codes

return a number to send a status code and message

```js
let app = srvr([
  ['GET /admin', function (req, res) {
    if (!req.isAdmin) return 401
    return 'Super secret admin page'
  }]
])
```

## error pages

do custom error pages like this

```js
let app = srvr([
  [404, function (req, res) {
    return 'page not found :('
  }],
  [500, function (req, res) {
    if (process.env.NODE_ENV === 'production') {
      ErrorReporter.track(res.err) // imaginary error reporter
      return 'An unknown error occurred'
    } else {
      console.error(res.err)
      return res.err.stack
    }
  }]
])
```

## errors

Throwing an error will send a 500 unless it has the statusCode property set.

srvr.error(*number* **code**[, *string* **message**]) is a useful shortcut

```js
let app = srvr([
  ['GET /broken', function (req, res) {
    throw srvr.error(400, 'oops :(')
  }]
])
```

## express middleware

Most middleware that works with express should work with srvr.

To use middleware globally,

```js
import bodyParser from 'body-parser'
import csurf from 'csurf'
import basicauth from 'basicauth-middleware'

let app = srvr([

  // csrf protection and body parsing only on this route
  ['POST /posts', csurf(), bodyParser.json(), async function (req, res) {
    await addNewPost(req.body.title, req.body.content)
    return 201
  }]

], [

  // remove to disable logging
  srvr.log,

  // basic auth on all routes
  basicauth('root', 'hunter2')

])
```

## files and downloads

srvr.file(*string* **path** [, *object* **options**])
srvr.file.download(*string* **path** [, *object* **options**])

Depends on [send](https://www.npmjs.com/package/send) and uses the same options

```js
let app = srvr([

  // simple static file response
  ['GET /cuteKitty.jpg', srvr.file('cats/1.jpg')],

  // dynamically send an arbitrary file
  ['GET /randomKitty.jpg', function (req, res) {
    let kittyId = Math.ceil(Math.random * 10)
    return srvr.file(`cats/${kittyId}.jpg`)
  }],

  // simple file download
  ['GET /kittyArchive.zip', srvr.file.download('cats/all.zip')],

  // dynamically send a file download
  ['GET /fancyKittyArchive.zip', function (req, res) {
    if (req.isAdmin) {
      return srvr.file.download('cats/fancy.zip')
    } else {
      return 401
    }
  }]

])
```

## redirects

srvr.file(*string* **location** [, *number* **code** = 302])

```js
let app = srvr([

  // static redirect
  ['GET /google', srvr.redirect('https://google.com/')],

  // dynamic redirect
  ['GET /random', function (req, res) {
    let url = Math.random() < 0.5 ? 'https://google.com/' : 'https://github.com/'
    return srvr.redirect(url)
  }],

  // permanent redirect
  ['GET /google/forever', srvr.redirect('https://google.com/', 301)]

])
```

## cookies

Depends on [cookie](https://www.npmjs.com/package/cookie) and uses the same
options

```js
let app = srvr([

  ['POST /logout', srvr.cookie, function (req, res) {
    if (req.cookies.auth) {
      res.cookie('auth', '', {
        expires: new Date()
      })
      return 'goodbye'
    } else {
      return 401
    }
  }]

])
```

## static directories

Depends on [serve-static](https://www.npmjs.com/package/serve-static) and uses
the same options

```js
let app = srvr([

  srvr.static('/', './public')

])
```
