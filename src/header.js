module.exports = header

function header (field, value) {
  return function setHeader (req, res) {
    if (typeof field === 'object') {
      Object.keys(field).forEach(function (name) {
        res.setHeader(name, field[name])
      })
    } else {
      res.setHeader(field, value)
    }
  }
}
