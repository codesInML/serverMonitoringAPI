const _data = require("../data");
const _tokens = require("./tokens");
const { hash, DB_DOCS, errorResponse } = require("../helpers");

const _users = {};

_users.POST = (req, callback) => {
  const firstName =
    typeof req.body.firstName == "string" &&
    req.body.firstName.trim().length > 0
      ? req.body.firstName.trim()
      : false;
  const lastName =
    typeof req.body.lastName == "string" && req.body.lastName.trim().length > 0
      ? req.body.lastName.trim()
      : false;
  const email =
    typeof req.body.email == "string" && req.body.email.trim().length > 0
      ? req.body.email.trim()
      : false;
  const phoneNumber =
    typeof req.body.phoneNumber == "string" &&
    req.body.phoneNumber.trim().length > 0
      ? req.body.phoneNumber.trim()
      : false;
  const password =
    typeof req.body.password == "string" && req.body.password.trim().length > 0
      ? req.body.password.trim()
      : false;
  const tosAgreement =
    typeof req.body.tosAgreement == "boolean" && req.body.tosAgreement
      ? true
      : false;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phoneNumber ||
    !password ||
    !tosAgreement
  )
    return callback(400, errorResponse("Missing required fields"));

  _data.read(DB_DOCS.USERS, email, function (err, data) {
    if (!err) {
      console.log(err);
      return callback(400, errorResponse("user exists"));
    }

    const hashedPassword = hash(password);

    if (!hashedPassword)
      return callback(500, errorResponse("could not hash password"));

    const payload = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      tosAgreement: true,
    };

    _data.create(DB_DOCS.USERS, email, payload, function (err) {
      if (err) {
        console.log(err);
        return callback(500, errorResponse("could not create new user"));
      }

      callback(201);
    });
  });
};

_users.GET = (req, callback) => {
  const email =
    typeof req.query.email == "string" && req.query.email.trim().length > 0
      ? req.query.email.trim()
      : false;

  if (!email)
    return callback(400, errorResponse("Missing required email query param"));

  const token =
    typeof req.headers.token == "string" ? req.headers.token : false;

  _tokens.verifyToken(token, email, function (isValid) {
    if (!isValid) return callback(403, errorResponse("invalid header token"));

    _data.read(DB_DOCS.USERS, email, function (err, data) {
      if (err) return callback(errorResponse("could not find user"));
      delete data.password;
      callback(200, data);
    });
  });
};

_users.PUT = (req, callback) => {
  const email =
    typeof req.body.email == "string" && req.body.email.trim().length > 0
      ? req.body.email.trim()
      : false;
  const firstName =
    typeof req.body.firstName == "string" &&
    req.body.firstName.trim().length > 0
      ? req.body.firstName.trim()
      : false;
  const lastName =
    typeof req.body.lastName == "string" && req.body.lastName.trim().length > 0
      ? req.body.lastName.trim()
      : false;
  const phoneNumber =
    typeof req.body.phoneNumber == "string" &&
    req.body.phoneNumber.trim().length > 0
      ? req.body.phoneNumber.trim()
      : false;
  const password =
    typeof req.body.password == "string" && req.body.password.trim().length > 0
      ? req.body.password.trim()
      : false;

  if (!email)
    return callback(400, errorResponse("Missing required email field"));
  if (!firstName && !lastName && !phoneNumber && !password)
    return callback(400, errorResponse("Missing fields to update"));

  const token =
    typeof req.headers.token == "string" ? req.headers.token : false;

  _tokens.verifyToken(token, email, function (isValid) {
    if (!isValid) return callback(403, errorResponse("invalid header token"));

    _data.read(DB_DOCS.USERS, email, function (err, data) {
      if (!err && data) {
        if (firstName) data.firstName = firstName;
        if (lastName) data.lastName = lastName;
        if (phoneNumber) data.phoneNumber = phoneNumber;
        if (password) {
          const hashedPassword = hash(password);

          if (!hashedPassword)
            return callback(500, errorResponse("could not hash password"));

          data.password = hashedPassword;
        }
        _data.update(DB_DOCS.USERS, email, data, function (err) {
          if (err) return callback(500, errorResponse("could not update user"));
          callback(200);
        });
      } else {
        callback(404, errorResponse("could not find user"));
      }
    });
  });
};

_users.DELETE = (req, callback) => {
  const email =
    typeof req.query.email == "string" && req.query.email.trim().length > 0
      ? req.query.email.trim()
      : false;

  if (!email)
    return callback(400, errorResponse("Missing required email query param"));

  const token =
    typeof req.headers.token == "string" ? req.headers.token : false;

  _tokens.verifyToken(token, email, function (isValid) {
    console.log(isValid, "ran here");
    if (!isValid) return callback(403, errorResponse("invalid header token"));

    _data.read(DB_DOCS.USERS, email, function (err, userData) {
      if (err || !userData)
        return callback(404, errorResponse("could not find user"));

      _data.delete(DB_DOCS.USERS, email, function (err) {
        if (err) return callback(500, errorResponse("could not delete user"));

        if (userData.checks) {
          for (let check of userData.checks) {
            _data.delete(DB_DOCS.CHECKS, check, function (err) {
              if (err) console.log(err);
            });
          }
        }

        callback(201);
      });
    });
  });
};

module.exports = _users;
