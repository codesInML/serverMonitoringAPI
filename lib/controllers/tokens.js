const _data = require("../data");
const {
  errorResponse,
  DB_DOCS,
  hash,
  createRandomString,
  TOKEN_LENGTH,
} = require("../helpers");

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
      return callback(400, errorResponse("invalid credentials"));

    const hashedPassword = hash(password);
    if (hashedPassword !== data.password)
      return callback(400, errorResponse("invalid credentials"));

    const tokenId = createRandomString(TOKEN_LENGTH);
    const expiresAt = Date.now() + 1000 * 60 * 60;
    const tokenObj = { id: tokenId, email, expiresAt };

    _data.create(DB_DOCS.TOKENS, tokenId, tokenObj, function (err) {
      if (err) return callback(500, errorResponse("could not create token"));
      callback(201, tokenObj);
    });
  });
};

_tokens.GET = (req, callback) => {
  const token =
    typeof req.query.token == "string" &&
    req.query.token.trim().length == TOKEN_LENGTH
      ? req.query.token.trim()
      : false;

  if (!token)
    return callback(400, errorResponse("Missing required token query param"));

  _data.read(DB_DOCS.TOKENS, token, function (err, data) {
    if (err || !data)
      return callback(400, errorResponse("could not get token"));
    callback(200, data);
  });
};

_tokens.PUT = (req, callback) => {
  const token =
    typeof req.body.token == "string" &&
    req.body.token.trim().length == TOKEN_LENGTH
      ? req.body.token.trim()
      : false;
  const extend =
    typeof req.body.extend == "boolean" && req.body.extend == true
      ? true
      : false;

  if (!token || !extend)
    return callback(
      400,
      errorResponse("Missing required fields or fields are invalid")
    );

  _data.read(DB_DOCS.TOKENS, token, function (err, data) {
    if (err || !data)
      return callback(400, errorResponse("could not get token"));

    if (data.expiresAt < Date.now())
      return callback(400, errorResponse("could not extend expired token"));

    data.expiresAt = Date.now() + 1000 * 60 * 60;

    _data.update(DB_DOCS.TOKENS, token, data, function (err) {
      if (err)
        return callback(
          400,
          errorResponse("could not extend token expiration")
        );

      callback(201);
    });
  });
};

_tokens.DELETE = (req, callback) => {};

module.exports = _tokens;
