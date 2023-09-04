const _data = require("./data");
const helpers = require("./helpers");

const handlers = {};

handlers.users = (data, callback) => {
  const allowedMethods = ["POST", "GET", "PUT", "DELETE"];
  if (allowedMethods.includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

handlers._users.POST = (data, callback) => {
  const firstName =
    typeof data.body.firstName == "string" &&
    data.body.firstName.trim().length > 0
      ? data.body.firstName.trim()
      : false;
  const lastName =
    typeof data.body.lastName == "string" &&
    data.body.lastName.trim().length > 0
      ? data.body.lastName.trim()
      : false;
  const email =
    typeof data.body.email == "string" && data.body.email.trim().length > 0
      ? data.body.email.trim()
      : false;
  const phoneNumber =
    typeof data.body.phoneNumber == "string" &&
    data.body.phoneNumber.trim().length > 0
      ? data.body.phoneNumber.trim()
      : false;
  const password =
    typeof data.body.password == "string" &&
    data.body.password.trim().length > 0
      ? data.body.password.trim()
      : false;
  const tosAgreement =
    typeof data.body.tosAgreement == "boolean" && data.body.tosAgreement
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

handlers._users.GET = (data, callback) => {
  const email =
    typeof data.query.email == "string" && data.query.email.trim().length > 0
      ? data.query.email.trim()
      : false;

  if (!email)
    return callback(400, { Error: "Missing required email query param" });

  _data.read("users", email, function (err, data) {
    if (err) return callback(400, { Error: "could not find user" });
    callback(200, data);
  });
};

handlers._users.PUT = (data, callback) => {};

handlers._users.DELETE = (data, callback) => {};

handlers.ping = (data, callback) => callback(200);

handlers.sampleHandler = (data, callback) => {
  callback(200, { name: "sample handler" });
};

handlers.notFoundHandler = (data, callback) => {
  callback(404, { message: "route does not exist" });
};

module.exports = handlers;
