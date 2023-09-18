const http = require("http");
const https = require("https");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const handlers = require("./handlers");
const helpers = require("./helpers");

const server = {};

server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");
  const query = parsedUrl.query;
  const headers = req.headers;
  const method = req.method.toUpperCase();

  //   handle req on the body
  const decoder = new StringDecoder("utf-8");
  let buffer = "";
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const chosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFoundHandler;

    const data = {
      trimmedPath,
      query,
      method,
      headers,
      body: helpers.parseJSONToObject(buffer),
    };

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof +statusCode == "number" ? +statusCode : 200;
      payload = typeof payload == "object" ? { data: payload } : { data: {} };
      payload.status = statusCode;

      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(JSON.stringify(payload));
      console.log(method, trimmedPath, statusCode, payload);
    });
  });
};

server.httpServer = http.createServer(server.unifiedServer);
server.httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
};
server.httpsServer = https.createServer(
  server.httpsOptions,
  server.unifiedServer
);

server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

server.init = () => {
  server.httpServer.listen(config.HTTP_PORT, () => {
    console.log(
      `server is listening on port ${config.HTTP_PORT} in ${config.ENV_NAME} mode.`
    );
  });

  server.httpsServer.listen(config.HTTPS_PORT, () => {
    console.log(
      `server is listening on port ${config.HTTPS_PORT} in ${config.ENV_NAME} mode.`
    );
  });
};

module.exports = server;
