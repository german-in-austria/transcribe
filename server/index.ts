const express = require("express");
// const cookieSession = require('cookie-session')
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");

const app = express();

// This app runs behind an
// application load balancer
// which handles the Certificate
// Negotiation for us, so we must
// trust them if they say it’s https.
app.enable("trust proxy");

/*
// redirect to https if it’s a
// http call.
app.use((request: any, response: any, next: any) => {
  const host = request.headers.host
  const protocol = request.protocol
  if (process.env.NODE_ENV === 'production' && protocol === 'http') {
    response.redirect(301, 'https://' + host + request.url)
  } else {
    next()
  }
})*/

app.use(compression());

app.use("/", express.static(path.join(__dirname, "../dist")));

// We need to server HTTPS requests when the test runs.
if (process.env.NODE_ENV === "test") {
  const privateKey = fs.readFileSync("./certs/ssl.key", "utf8");
  const certificate = fs.readFileSync("./certs/ssl.crt", "utf8");
  const credentials = { key: privateKey, cert: certificate };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(process.env.NODE_PORT, () => {
    console.log(`Started HTTTPS server on port ${process.env.NODE_PORT}`);
  });
} else {
  const httpServer = http.createServer(app);
  httpServer.listen(process.env.NODE_PORT, () => {
    console.log(`Started HTTP server on port ${process.env.NODE_PORT}`);
  });
}
