const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const lib = {};

lib.baseDir = path.join(__dirname, "/../.logs/");

lib.append = (fileName, stringData, callback) => {
  fs.open(lib.baseDir + fileName + ".log", "a", function (err, fd) {
    if (err || !fd) return callback("could not open file for appending");

    fs.appendFile(fd, stringData + "\n", function (err) {
      if (err) return callback("error appending to file");
      fs.close(fd, function (err) {
        if (err) return callback("error closing appended file");
        callback(false);
      });
    });
  });
};

lib.list = (includeCompressLogs, callback) => {
  fs.readdir(lib.baseDir, function (err, data) {
    if (err || !data || !data.length) return callback(err, data);

    const trimmedFileNames = [];

    for (let fileName of data) {
      if (fileName.indexOf(".log") > -1)
        trimmedFileNames.push(fileName.replace(".log", ""));

      // Add the .gz files
      if (fileName.indexOf(".gz.b64") > -1 && includeCompressLogs)
        trimmedFileNames.push(fileName.replace(".gz.b64", ""));
    }

    callback(false, trimmedFileNames);
  });
};

lib.compress = (logId, newLogId, callback) => {
  const sourceFile = logId + ".log";
  const destFile = newLogId + ".gz.b64";

  fs.readFile(lib.baseDir + sourceFile, "utf-8", function (err, stringData) {
    if (err || !stringData) return callback(err);

    zlib.gzip(stringData, function (err, buffer) {
      if (err || !buffer) return callback(err);

      fs.open(lib.baseDir + destFile, "wx", function (err, fd) {
        if (err || !fd) return callback(err);

        fs.writeFile(fd, buffer.toString("base64"), function (err) {
          if (err) return callback(err);

          fs.close(fd, function (err) {
            if (err) return callback(err);
            callback(false);
          });
        });
      });
    });
  });
};

lib.decompress = (fileId, callback) => {
  const fileName = fileId + ".gz.b64";
  fs.readFile(lib.baseDir + fileName, "utf-8", function (err, stringData) {
    if (err || !stringData) return callback(err);

    const inputBuffer = Buffer.from(stringData, "base64");
    zlib.unzip(inputBuffer, function (err, outputBuffer) {
      if (err || !outputBuffer) return callback(err);

      const data = outputBuffer.toString();
      callback(false, data);
    });
  });
};

lib.truncate = (logId, callback) => {
  fs.truncate(lib.baseDir + logId + ".log", 0, function (err) {
    if (err) return callback(err);
    callback(false);
  });
};

module.exports = lib;
