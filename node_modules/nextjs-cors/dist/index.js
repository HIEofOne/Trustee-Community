
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./nextjs-cors.cjs.production.min.js')
} else {
  module.exports = require('./nextjs-cors.cjs.development.js')
}
