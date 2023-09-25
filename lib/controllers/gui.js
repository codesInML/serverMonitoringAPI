const helpers = require("../helpers");

const gui = {};

gui.index = (req, callback) => {
  if (req.method !== "GET") return callback(405, undefined, "html");

  helpers.getTemplate("index", function (err, str) {
    if (err || !str) return callback(500, undefined, "html");
    callback(200, str, "html");
  });
};

module.exports = gui;
