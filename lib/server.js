const http = require("http");
const https = require("https");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const handlers = require("./handlers");
const helpers = require("./helpers");
const util = require("util");
const debug = util.debuglog("server");

const server = {};

server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.path;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
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

    let chosenHandler =
      typeof server.router[parsedUrl.pathname.replace(/^\/+|\/+$/g, "")] !==
      "undefined"
        ? server.router[parsedUrl.pathname.replace(/^\/+|\/+$/g, "")]
        : handlers.notFoundHandler;

    chosenHandler = trimmedPath.includes("public/")
      ? handlers.public
      : chosenHandler;

    const data = {
      trimmedPath,
      query,
      method,
      headers,
      body: helpers.parseJSONToObject(buffer),
    };

    chosenHandler(data, (statusCode, payload, contentType = "json") => {
      console.log({ statusCode, payload, contentType });
      statusCode =
        statusCode && typeof +statusCode == "number" ? +statusCode : 200;

      let payloadString = "";
      if (contentType == "json") {
        res.setHeader("Content-Type", "application/json");
        payload = typeof payload == "object" ? { data: payload } : { data: {} };
        payload.status = statusCode;
        payloadString = JSON.stringify(payload);
      }
      if (contentType == "html") {
        res.setHeader("Content-Type", "text/html");
        payloadString = typeof payload == "string" ? payload : payloadString;
      }
      if (contentType == "favicon") {
        res.setHeader("Content-Type", "image/x-icon");
        payloadString =
          typeof payload !== "undefined" ? payload : payloadString;
      }
      if (contentType == "css") {
        res.setHeader("Content-Type", "text/css");
        payloadString =
          typeof payload !== "undefined" ? payload : payloadString;
      }
      if (contentType == "png") {
        res.setHeader("Content-Type", "image/png");
        payloadString =
          typeof payload !== "undefined" ? payload : payloadString;
      }
      if (contentType == "jpg") {
        res.setHeader("Content-Type", "image/jpeg");
        payloadString =
          typeof payload !== "undefined" ? payload : payloadString;
      }
      if (contentType == "plain") {
        res.setHeader("Content-Type", "text/html");
        payloadString =
          typeof payload !== "undefined" ? payload : payloadString;
      }

      res.writeHead(statusCode);
      res.end(payloadString);

      if (statusCode == 201 || statusCode == 200)
        debug("\x1b[32m%s\x1b[0m", `${method} /${trimmedPath} ${statusCode}`);
      else
        debug("\x1b[31m%s\x1b[0m", `${method} /${trimmedPath} ${statusCode}`);
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
  "": handlers.index,
  "account/create": handlers.accountCreate,
  "account/edit": handlers.accountEdit,
  "account/deleted": handlers.accountDeleted,
  "session/create": handlers.sessionCreate,
  "session/deleted": handlers.sessionDeleted,
  "checks/all": handlers.checksList,
  "checks/create": handlers.checksCreate,
  "checks/edit": handlers.checksEdit,
  ping: handlers.ping,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/checks": handlers.checks,
  "favicon.ico": handlers.favicon,
  public: handlers.public,
};

server.init = () => {
  server.httpServer.listen(config.HTTP_PORT, () => {
    console.log(
      "\x1b[35m%s\x1b[0m",
      `server is listening on port ${config.HTTP_PORT} in ${config.ENV_NAME} mode.`
    );
  });

  server.httpsServer.listen(config.HTTPS_PORT, () => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `server is listening on port ${config.HTTPS_PORT} in ${config.ENV_NAME} mode.`
    );
  });
};

module.exports = server;
