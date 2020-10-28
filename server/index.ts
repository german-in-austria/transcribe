
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path : './env-dev.env'
  })
};

import * as express from 'express'
import cookieSession from 'cookie-session'
import * as compression from 'compression'
import * as path from 'path'
import * as peer from 'peer'
const app = express()
import { readFileSync } from 'fs'
const index = readFileSync('./dist/index.html', 'utf8')

const p = peer.ExpressPeerServer

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
