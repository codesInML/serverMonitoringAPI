const _users = require("./controllers/users");
const _tokens = require("./controllers/tokens");
const _checks = require("./controllers/checks");
const gui = require("./controllers/gui");
const handlers = {};

handlers.index = gui.index;
handlers.favicon = gui.favicon;
handlers.public = gui.public;

handlers._users = _users;
handlers.users = (req, callback) => {
  const allowedMethods = ["POST", "GET", "PUT", "DELETE"];
  if (allowedMethods.includes(req.method)) {
    handlers._users[req.method](req, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = _tokens;
handlers.tokens = (req, callback) => {
  const allowedMethods = ["POST", "GET", "PUT", "DELETE"];
  if (allowedMethods.includes(req.method)) {
    handlers._tokens[req.method](req, callback);
  } else {
    callback(405);
  }
};

handlers._checks = _checks;
handlers.checks = (req, callback) => {
  const allowedMethods = ["POST", "GET", "PUT", "DELETE"];
  if (allowedMethods.includes(req.method)) {
    handlers._checks[req.method](req, callback);
  } else {
    callback(405);
  }
};

handlers.ping = (req, callback) => callback(200);

handlers.sampleHandler = (req, callback) => {
  callback(200, { name: "sample handler" });
};

handlers.notFoundHandler = (req, callback) => {
  callback(404, { message: "route does not exist" });
};

module.exports = handlers;
