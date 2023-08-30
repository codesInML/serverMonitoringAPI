const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");

const server = http.createServer((req, res) => {
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
});

server.listen(3000, () => {
  console.log("server is listening on http://localhost:3000");
});

const handlers = {};

handlers.sampleHandler = (data, callback) => {
  callback(200, { name: "sample handler" });
};

handlers.notFoundHandler = (data, callback) => {
  callback(404);
};

const router = {
  sample: handlers.sampleHandler,
};
