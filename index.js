const http = require("http");
const https = require("https");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const fs = require("fs");
const config = require("./lib/config");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

const unifiedServer = (req, res) => {
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
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
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
      payload = typeof payload == "object" ? payload : {};

      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(JSON.stringify(payload));
      console.log(method, trimmedPath, statusCode, payload);
    });
  });
};

const httpServer = http.createServer(unifiedServer);
const httpsOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
const httpsServer = https.createServer(httpsOptions, unifiedServer);

httpServer.listen(config.HTTP_PORT, () => {
  console.log(
    `server is listening on port ${config.HTTP_PORT} in ${config.ENV_NAME} mode.`
  );
});

httpsServer.listen(config.HTTPS_PORT, () => {
  console.log(
    `server is listening on port ${config.HTTPS_PORT} in ${config.ENV_NAME} mode.`
  );
});

const router = {
  ping: handlers.pingHandler,
  users: handlers.users,
};
