const _data = require("../data");
const _tokens = require("./tokens");
const config = require("../config");
const { DB_DOCS, errorResponse, createRandomString } = require("../helpers");

const _checks = {};

_checks.POST = (req, callback) => {
  const protocol =
    typeof req.body.protocol == "string" &&
    ["https", "http"].includes(req.body.protocol.trim())
      ? req.body.protocol.trim()
      : false;
  const url =
    typeof req.body.url == "string" && req.body.url.trim().length > 0
      ? req.body.url.trim()
      : false;
  const method =
    typeof req.body.method == "string" &&
    ["post", "get", "put", "delete"].includes(
      req.body.method.trim().toLowerCase()
    )
      ? req.body.method.trim().toUpperCase()
      : false;
  let successCodes =
    typeof req.body.successCodes == "object" &&
    req.body.successCodes instanceof Array &&
    req.body.successCodes.length > 0
      ? req.body.successCodes
      : false;
  const timeoutSeconds =
    typeof req.body.timeoutSeconds == "number" &&
    req.body.timeoutSeconds % 1 === 0 &&
    req.body.timeoutSeconds >= 1 &&
    req.body.timeoutSeconds <= 5
      ? req.body.timeoutSeconds
      : false;

  if (!protocol || !url || !method || !successCodes || !timeoutSeconds)
    return callback(400, errorResponse("Missing required inputs"));

  for (let i = 0; i < successCodes.length; i++) {
    if (+successCodes[i]) successCodes[i] = +successCodes[i];
    else return callback(400, errorResponse("Only number codes are allowed"));
  }

  successCodes = [...new Set(successCodes)];

  const token =
    typeof req.headers.token == "string" ? req.headers.token : false;

  _data.read(DB_DOCS.TOKENS, token, function (err, data) {
    if (err || !data) return callback(401, errorResponse("unauthorized"));

    _tokens.verifyToken(token, data.email, function (isValid) {
      if (!isValid) return callback(401, errorResponse("invalid header token"));

      const email = data.email;
      _data.read(DB_DOCS.USERS, email, function (err, data) {
        if (err || !data) return callback(403, errorResponse("forbidden"));

        const userChecks =
          typeof data.checks == "object" && data.checks instanceof Array
            ? data.checks
            : [];

        if (userChecks.length >= config.MAX_CHECKS)
          return callback(
            400,
            errorResponse(
              `${config.MAX_CHECKS} maximum number of checks reached`
            )
          );

        const checkId = createRandomString(20);
        const checkObject = {
          id: checkId,
          protocol,
          method,
          url,
          successCodes,
          timeoutSeconds: +timeoutSeconds,
          email,
        };

        _data.create(DB_DOCS.CHECKS, checkId, checkObject, function (err) {
          if (err)
            return callback(500, errorResponse("could not create checks"));
          data.checks = userChecks;
          data.checks.push(checkId);

          _data.update(DB_DOCS.USERS, email, data, function (err) {
            if (err)
              return callback(
                500,
                errorResponse("could not update user with new check")
              );

            return callback(201, checkObject);
          });
        });
      });
    });
  });
};

_checks.GET = (req, callback) => {
  const id =
    typeof req.query.id == "string" && req.query.id.trim().length > 0
      ? req.query.id.trim()
      : false;

  if (!id)
    return callback(400, errorResponse("Missing required id query param"));

  _data.read(DB_DOCS.CHECKS, id, function (err, checkData) {
    if (err || !checkData)
      return callback(404, errorResponse("could not find check"));

    const token =
      typeof req.headers.token == "string" ? req.headers.token : false;

    _tokens.verifyToken(token, checkData.email, function (isValid) {
      if (!isValid) return callback(401, errorResponse("invalid header token"));

      callback(200, checkData);
    });
  });
};

_checks.PUT = (req, callback) => {
  const id =
    typeof req.body.id == "string" && req.body.id.trim().length > 0
      ? req.body.id.trim()
      : false;
  const protocol =
    typeof req.body.protocol == "string" &&
    ["https", "http"].includes(req.body.protocol.trim())
      ? req.body.protocol.trim()
      : false;
  const url =
    typeof req.body.url == "string" && req.body.url.trim().length > 0
      ? req.body.url.trim()
      : false;
  const method =
    typeof req.body.method == "string" &&
    ["post", "get", "put", "delete"].includes(
      req.body.method.trim().toLowerCase()
    )
      ? req.body.method.trim().toLowerCase()
      : false;
  let successCodes =
    typeof req.body.successCodes == "object" &&
    req.body.successCodes instanceof Array &&
    req.body.successCodes.length > 0
      ? req.body.successCodes
      : false;
  const timeoutSeconds =
    typeof req.body.timeoutSeconds == "number" &&
    req.body.timeoutSeconds % 1 === 0 &&
    req.body.timeoutSeconds >= 1 &&
    req.body.timeoutSeconds <= 5
      ? req.body.timeoutSeconds
      : false;

  if (!id) return callback(400, errorResponse("Missing required id field"));

  if (!protocol && !url && !method && !successCodes && !timeoutSeconds)
    return callback(400, errorResponse("Missing fields to update"));

  _data.read(DB_DOCS.CHECKS, id, function (err, data) {
    if (err || !data)
      return callback(404, errorResponse("could not find check"));

    const token =
      typeof req.headers.token == "string" ? req.headers.token : false;

    _tokens.verifyToken(token, data.email, function (isValid) {
      if (!isValid) return callback(403, errorResponse("invalid header token"));

      if (protocol) data.protocol = protocol;
      if (url) data.url = url;
      if (method) data.method = method;
      if (successCodes) data.successCodes = successCodes;
      if (timeoutSeconds) data.timeoutSeconds = timeoutSeconds;

      _data.update(DB_DOCS.CHECKS, id, data, function (err) {
        if (err) return callback(500, errorResponse("could not update check"));
        callback(201);
      });
    });
  });
};

_checks.DELETE = (req, callback) => {
  const id =
    typeof req.query.id == "string" && req.query.id.trim().length > 0
      ? req.query.id.trim()
      : false;

  if (!id)
    return callback(400, errorResponse("Missing required id query param"));

  _data.read(DB_DOCS.CHECKS, id, function (err, checkData) {
    if (err || !checkData)
      return callback(404, errorResponse("could not find check"));

    const token =
      typeof req.headers.token == "string" ? req.headers.token : false;

    _tokens.verifyToken(token, checkData.email, function (isValid) {
      if (!isValid) return callback(401, errorResponse("invalid header token"));

      _data.delete(DB_DOCS.CHECKS, id, function (err) {
        if (err) return callback(500, errorResponse("could not delete check"));

        _data.read(DB_DOCS.USERS, checkData.email, function (err, userData) {
          if (err || !userData)
            return callback(500, errorResponse("could not find user"));

          const userChecks =
            typeof userData.checks == "object" &&
            userData.checks instanceof Array
              ? userData.checks
              : [];

          const pos = userChecks.indexOf(id);

          if (pos <= -1) return callback(200);

          userChecks.splice(pos, 1);
          userData.checks = userChecks;

          _data.update(DB_DOCS.USERS, userData.email, userData, function (err) {
            if (err)
              return callback(500, errorResponse("could not update user"));

            callback(201);
          });
        });
      });
    });
  });
};

module.exports = _checks;
