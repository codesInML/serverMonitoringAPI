const crypto = require("crypto");
const config = require("./config");
const helpers = {};

helpers.DB_DOCS = {
  USERS: "users",
  TOKENS: "tokens",
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

module.exports = helpers;
