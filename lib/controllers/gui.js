const helpers = require("../helpers");

const gui = {};

gui.index = (req, callback) => {
  if (req.method !== "GET") return callback(405, undefined, "html");

  const templateData = {
    "head.title": "Home",
    "head.description": "This is the home page for the server uptime checker",
    "body.title": "Hello template world",
    "body.class": "index",
  };
  helpers.getTemplate("index", templateData, function (err, str) {
    if (err || !str) return callback(500, undefined, "html");

    helpers.addUniversalTemplates(str, templateData, function (err, str) {
      if (err || !str) return callback(500, undefined, "html");

      callback(200, str, "html");
    });
  });
};

module.exports = gui;
