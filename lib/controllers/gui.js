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

gui.favicon = (req, callback) => {
  if (req.method !== "GET") return callback(405, undefined, "html");

  helpers.getStaticAsset("favicon.ico", function (err, data) {
    if (err || !data) return callback(500);

    callback(200, data, "favicon");
  });
};

gui.public = (req, callback) => {
  if (req.method !== "GET") return callback(405, undefined, "html");

  const trimmedAssetName = req.trimmedPath.replace("public/", "").trim();

  if (!trimmedAssetName.length) return callback(404);

  helpers.getStaticAsset(trimmedAssetName, function (err, data) {
    if (err || !data) return callback(500);

    let contentType = "plain";

    if (trimmedAssetName.includes(".css")) contentType = "css";
    if (trimmedAssetName.includes(".png")) contentType = "png";
    if (trimmedAssetName.includes(".jpg")) contentType = "jpg";
    if (trimmedAssetName.includes(".ico")) contentType = "favicon";

    callback(200, data, contentType);
  });
};

module.exports = gui;
