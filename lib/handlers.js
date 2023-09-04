const _data = require("./data");
const helpers = require("./helpers");

const handlers = {};

handlers.users = (req, callback) => {
  const allowedMethods = ["POST", "GET", "PUT", "DELETE"];
  if (allowedMethods.includes(req.method)) {
    handlers._users[req.method](req, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

handlers._users.POST = (req, callback) => {
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
    return callback(400, { Error: "Missing required fields" });

  _data.read("users", email, function (err, data) {
    if (!err) {
      console.log(err);
      return callback(400, { Error: "user exists" });
    }

    const hashedPassword = helpers.hash(password);

    if (!hashedPassword)
      return callback(500, { Error: "could not hash password" });

    const payload = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      tosAgreement: true,
    };

    _data.create("users", email, payload, function (err) {
      if (err) {
        console.log(err);
        return callback(500, { Error: "could not create new user" });
      }

      callback(200);
    });
  });
};

handlers._users.GET = (req, callback) => {
  const email =
    typeof req.query.email == "string" && req.query.email.trim().length > 0
      ? req.query.email.trim()
      : false;

  if (!email)
    return callback(400, { Error: "Missing required email query param" });

  _data.read("users", email, function (err, data) {
    if (err) return callback(404, { Error: "could not find user" });
    delete data.password;
    callback(200, data);
  });
};

handlers._users.PUT = (req, callback) => {
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

  if (!email) callback(400, { Error: "Missing required email field" });
  if (!firstName && !lastName && !phoneNumber && !password)
    callback(400, { Error: "Missing fields to update" });

  _data.read("users", email, function (err, data) {
    if (!err && data) {
      if (firstName) data.firstName = firstName;
      if (lastName) data.lastName = lastName;
      if (phoneNumber) data.phoneNumber = phoneNumber;
      if (password) {
        const hashedPassword = helpers.hash(password);

        if (!hashedPassword)
          return callback(500, { Error: "could not hash password" });

        data.password = hashedPassword;
      }
      _data.update("users", email, data, function (err) {
        if (err) return callback(500, { Error: "could not update user" });
        callback(200);
      });
    } else {
      callback(404, { Error: "could not find user" });
    }
  });
};

handlers._users.DELETE = (req, callback) => {};

handlers.ping = (req, callback) => callback(200);

handlers.sampleHandler = (req, callback) => {
  callback(200, { name: "sample handler" });
};

handlers.notFoundHandler = (req, callback) => {
  callback(404, { message: "route does not exist" });
};

module.exports = handlers;
