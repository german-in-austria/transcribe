if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config({
    path : './env-dev.env'
  })
}

const express = require('express')
const cookieSession = require('cookie-session')
const compression = require('compression')
const path = require('path')
const app = express()
const index = require('fs').readFileSync('./dist/index.html', 'utf8')

// This app runs behind an
// application load balancer
// which handles the Certificate
// Negotiation for us, so we must
// trust them if they say it’s https.
app.enable('trust proxy')

// redirect to https if it’s a
// http call.
app.use((request, response, next) => {
  const host = request.headers.host
  const protocol = request.protocol
  if (process.env.NODE_ENV === 'production' && protocol === 'http') {
    response.redirect(301, 'https://' + host + request.url)
  } else {
    next()
  }
})

app.use(compression())

app.use('/', express.static(path.join(__dirname, '../dist')))

app.listen(process.env.NODE_PORT || 3333, () => {
  console.log(`Started server on port ${process.env.NODE_PORT}`)
})
