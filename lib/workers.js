const path = require("path");
const fs = require("fs");
const _data = require("./data");
const https = require("https");
const http = require("http");
const url = require("url");
const { DB_DOCS, sendTwilioSMS } = require("./helpers");

const workers = {};

workers.alertUsersToStatusChange = (check) => {
  const message = `Alert: Your check for ${check.method} ${check.protocol}://${check.url} is currently ${check.state}`;

  _data.read(DB_DOCS.USERS, check.email, function (err, data) {
    if (err || !data)
      return console.error("unable to send sms, could not find user");

    sendTwilioSMS(data.phoneNumber?.slice(1), message, function (err) {
      if (err) return console.error("could not send sms: ", err);

      console.log(`SMS sent -> ${message}`);
    });
  });
};

workers.processCheckOutcome = (check, outcome) => {
  const state =
    !outcome.error &&
    outcome.responseCode &&
    check.successCodes.includes(outcome.responseCode)
      ? "up"
      : "down";

  const shouldAlert = check.lastChecked && check.state !== state ? true : false;
  const newCheck = check;
  newCheck.state = state;
  newCheck.lastChecked = Date.now();

  _data.update(DB_DOCS.CHECKS, check.id, newCheck, function (err) {
    if (err) return console.error("could not update check");

    if (shouldAlert) workers.alertUsersToStatusChange(newCheck);
    else console.log("Check outcome has not changed");
  });
};

workers.performCheck = (check) => {
  const checkOutcome = { error: false, responseCode: false };
  let outcomeSent = false;
  const parsedUrl = url.parse(`${check.protocol}://${check.url}`, true);

  const requestDetails = {
    protocol: check.protocol + ":",
    hostname: parsedUrl.hostname,
    method: check.method,
    path: parsedUrl.path,
    timeout: check.timeoutSeconds * 1000,
  };

  const protocolToUse = check.protocol == "http" ? http : https;

  const req = protocolToUse.request(requestDetails, function (res) {
    checkOutcome.responseCode = res.statusCode;
    if (!outcomeSent) {
      workers.processCheckOutcome(check, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("error", function (err) {
    checkOutcome.error = { error: true, value: err };
    if (!outcomeSent) {
      workers.processCheckOutcome(check, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("timeout", function (err) {
    checkOutcome.error = { error: true, value: "timeout" };
    if (!outcomeSent) {
      workers.processCheckOutcome(check, checkOutcome);
      outcomeSent = true;
    }
  });
  req.end();
};

workers.validateCheckData = (check) => {
  check = typeof check == "object" && check !== null ? check : {};
  check.id =
    typeof check.id == "string" && check.id.length == 20
      ? check.id.trim()
      : false;
  check.email =
    typeof check.email == "string" && check.email.trim()
      ? check.email.trim()
      : false;
  check.protocol =
    typeof check.protocol == "string" &&
    ["https", "http"].includes(check.protocol.trim())
      ? check.protocol.trim()
      : false;
  check.url =
    typeof check.url == "string" && check.url.trim().length > 0
      ? check.url.trim()
      : false;
  check.method =
    typeof check.method == "string" &&
    ["post", "get", "put", "delete"].includes(check.method.trim().toLowerCase())
      ? check.method.trim()
      : false;
  check.successCodes =
    typeof check.successCodes == "object" &&
    check.successCodes instanceof Array &&
    check.successCodes.length > 0
      ? check.successCodes
      : false;
  check.timeoutSeconds =
    typeof check.timeoutSeconds == "number" &&
    check.timeoutSeconds % 1 === 0 &&
    check.timeoutSeconds >= 1 &&
    check.timeoutSeconds <= 5
      ? check.timeoutSeconds
      : false;

  check.state =
    typeof check.state == "string" &&
    ["up", "down"].includes(check.state.trim())
      ? check.state.trim()
      : false;
  check.lastChecked =
    typeof check.lastChecked == "number" && check.lastChecked > 0
      ? check.lastChecked
      : false;

  if (
    !check.id ||
    !check.protocol ||
    !check.url ||
    !check.method ||
    !check.successCodes ||
    !check.timeoutSeconds
  )
    return console.error("one of the validation checks failed");

  workers.performCheck(check);
};

workers.gatherAllChecks = () => {
  _data.list(DB_DOCS.CHECKS, function (err, checks) {
    if (err || !checks) return console.error("could not find any checks");
    if (!checks.length)
      return console.error("could not find checks to process");

    for (let check of checks) {
      _data.read(DB_DOCS.CHECKS, check, function (err, originalCheckData) {
        if (err || !originalCheckData)
          return console.error("error reading one of the checks");

        workers.validateCheckData(originalCheckData);
      });
    }
  });
};

workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

workers.init = () => {
  workers.gatherAllChecks();

  workers.loop();
};

module.exports = workers;
