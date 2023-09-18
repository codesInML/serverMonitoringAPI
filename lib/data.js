const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

const lib = {};

lib.dirName = path.join(__dirname, "/../.data/");

lib.create = (dir, file, data, callback) => {
  fs.open(lib.dirName + dir + "/" + file + ".json", "wx", function (err, fd) {
    if (!err && fd) {
      data = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
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

lib.read = (dir, file, callback) => {
  fs.readFile(
    lib.dirName + dir + "/" + file + ".json",
    "utf-8",
    function (err, data) {
      if (!err && data) {
        return callback(false, helpers.parseJSONToObject(data));
      } else {
        console.error(err);
        callback(err, data);
      }
    }
  );
};

lib.update = (dir, file, data, callback) => {
  data = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  fs.open(lib.dirName + dir + "/" + file + ".json", "r+", function (err, fd) {
    if (!err && fd) {
      fs.ftruncate(fd, function (err) {
        if (!err) {
          fs.writeFile(fd, JSON.stringify(data), function (err) {
            if (!err) {
              fs.close(fd, function (err) {
                if (!err) {
                  callback(false);
                } else {
                  callback("could not close existing file");
                }
              });
            } else {
              callback("could not write to existing file");
            }
          });
        } else {
          return callback("could not truncate file");
        }
      });
    } else callback("could not open the file for updating, might not exist");
  });
};

lib.delete = (dir, file, callback) => {
  fs.unlink(lib.dirName + dir + "/" + file + ".json", function (err) {
    if (!err) callback(false);
    else callback("could not delete file");
  });
};

lib.list = function (dir, callback) {
  fs.readdir(lib.dirName + dir + "/", function (err, data) {
    if (err || !data) return callback(err, false);

    const trimmedFileNames = [];
    for (let file of data) trimmedFileNames.push(file.replace(".json", ""));

    callback(false, trimmedFileNames);
  });
};

module.exports = lib;
