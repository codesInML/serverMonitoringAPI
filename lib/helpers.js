const crypto = require("crypto");
const config = require("./config");
const https = require("https");
const queryString = require("querystring");
const path = require("path");
const fs = require("fs");
const helpers = {};

helpers.DB_DOCS = {
  USERS: "users",
  TOKENS: "tokens",
  CHECKS: "checks",
};

helpers.hash = (str) => {
  if (typeof str == "string" && str.length) {
    return crypto
      .createHmac("sha256", config.HASH_SECRET)
      .update(str)
      .digest("hex");
  } else {
    return false;
  }
};

helpers.parseJSONToObject = (str) => {
  try {
    if (str) return JSON.parse(str);
    return {};
  } catch (error) {
    console.error(error);
    return {};
  }
};

helpers.errorResponse = (str) => ({ Error: str });

helpers.TOKEN_LENGTH = 250;

helpers.createRandomString = (length) => {
  length = typeof +length == "number" && +length ? +length : false;

  if (!length) return false;

  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let builtStr = "";

  while (length) {
    builtStr += chars.charAt(Math.floor(Math.random() * chars.length));
    length--;
  }

  return builtStr;
};

helpers.sendTwilioSMS = (phoneNumber, message, callback) => {
  phoneNumber =
    typeof phoneNumber == "string" && phoneNumber.trim().length == 10
      ? phoneNumber.trim()
      : false;
  message =
    typeof message == "string" &&
    message.trim().length > 0 &&
    message.trim().length <= 1600
      ? message.trim()
      : false;

  if (!phoneNumber || !message) return callback("Given parameters are invalid");

  const payload = {
    From: config.TWILIO.FROM,
    To: `+234${phoneNumber}`,
    Body: message,
  };

  const stringPayload = queryString.stringify(payload);

  const requestDetails = {
    protocol: "https:",
    hostname: "api.twilio.com",
    method: "POST",
    path: `/2010-04-01/Accounts/${config.TWILIO.ACCOUNT_SID}/Messages.json`,
    auth: `${config.TWILIO.ACCOUNT_SID}:${config.TWILIO.AUTH_TOKEN}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload),
    },
  };

  const req = https.request(requestDetails, function (res) {
    const statusCode = res.statusCode;

    if (statusCode !== 200 && statusCode !== 201)
      return callback(`request failed with status ${statusCode}`);

    callback(false);
  });

  req.on("error", function (err) {
    callback(err);
  });
  req.write(stringPayload);
  req.end();
};

helpers.getTemplate = (templateName, callback) => {
  templateName =
    typeof templateName == "string" && templateName.length > 0
      ? templateName
      : false;

  if (!templateName) return callback("invalid template name");

  const templateDir = path.join(__dirname, "/../templates/");

  fs.readFile(
    templateDir + templateName + ".html",
    "utf-8",
    function (err, data) {
      if (err || !data || !data.length)
        return callback("template was not found");
      callback(false, data);
    }
  );
};

module.exports = helpers;
