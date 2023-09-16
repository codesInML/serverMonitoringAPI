const crypto = require("crypto");
const config = require("./config");
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

module.exports = helpers;
