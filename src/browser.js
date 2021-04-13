const api = require("./api");
const auth = require("./auth");
const broadcast = require("./broadcast");
const config = require("./config");
const formatter = require("./formatter")(api);
const memo = require('./auth/memo');
const messages = require('./auth/messages');
const utils = require("./utils");

const golos = {
  api,
  auth,
  broadcast,
  config,
  formatter,
  memo,
  messages,
  utils
};

if (typeof window !== "undefined") {
  window.golos = golos;
}

if (typeof global !== "undefined") {
  global.golos = golos;
}

exports = module.exports = golos;
