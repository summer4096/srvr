module.exports = function moduleRequire (source, dep) {
  try {
    return require(dep)
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      err.message = (
        'srvr.' + source + ' depends on the ' + dep + ' module to function correctly. Try running:\n\n' +
        'npm install --save ' + dep + '\n\n' +
        err.message
      )
    }
    throw err
  }
}
