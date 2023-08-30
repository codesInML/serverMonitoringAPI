const http = require("http");
const https = require("https");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const fs = require("fs");
const config = require("./config");
const _data = require("./lib/data");

_data.create(
  "test",
  "users",
  {
    name: "Ifeoluwa Olubo",
  },
  function (err) {
    if (!err) {
      console.log("Wrote to file DB");
    } else {
      console.error(err);
    }
  }
);

const unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");
  const queryString = parsedUrl.query;
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
      queryString,
      method,
      headers,
      body: buffer,
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

const handlers = {};

handlers.ping = (data, callback) => callback(200);

handlers.sampleHandler = (data, callback) => {
  callback(200, { name: "sample handler" });
};

handlers.notFoundHandler = (data, callback) => {
  callback(404, { message: "route does not exist" });
};

const router = {
  ping: handlers.pingHandler,
};
