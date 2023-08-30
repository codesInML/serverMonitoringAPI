const fs = require("fs");
const path = require("path");

const lib = {};

lib.dirName = path.dirname(__dirname, "/../.data/");

lib.create = (dir, file, data, callback) => {
  fs.open(lib.dirName + dir + "/" + file + ".json", "wx", function (err, fd) {
    if (!err && fd) {
      console.log({ fd });
      fs.writeFile(fd, JSON.stringify(data), function (err) {
        if (!err) {
          fs.close(fd, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback("Error closing new file");
            }
          });
        } else {
          callback("Error writing to new file");
        }
      });
    } else {
      console.error(err);
      callback("could not create file, might already exist");
    }
  });
};

module.exports = lib;
