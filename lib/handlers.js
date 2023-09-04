const _users = require("./controllers/users");
const handlers = {};

handlers._users = _users;
handlers.users = (req, callback) => {
  const allowedMethods = ["POST", "GET", "PUT", "DELETE"];
  if (allowedMethods.includes(req.method)) {
    handlers._users[req.method](req, callback);
  } else {
    callback(405);
  }
};

handlers.tokens = (req, callback) => {
  const allowedMethods = ["POST", "GET", "PUT", "DELETE"];
  if (allowedMethods.includes(req.method)) {
    handlers._tokens[req.method](req, callback);
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
