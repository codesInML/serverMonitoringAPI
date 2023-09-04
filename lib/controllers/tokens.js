const _data = require("../data");
const { errorResponse, DB_DOCS } = require("../helpers");

const _tokens = {};

_tokens.POST = (req, callback) => {
  const email =
    typeof req.body.email == "string" && req.body.email.trim().length > 0
      ? req.body.email.trim()
      : false;
  const password =
    typeof req.body.password == "string" && req.body.password.trim().length > 0
      ? req.body.password.trim()
      : false;

  if (!password || !email)
    return callback(400, errorResponse("Missing required fields"));

  _data.read(DB_DOCS.USERS, email, function (err, data) {
    if (err || !data)
      return callback(400, errorResponse("could not find user"));
  });
};

_tokens.GET = (req, callback) => {};

_tokens.PUT = (req, callback) => {};

_tokens.DELETE = (req, callback) => {};
