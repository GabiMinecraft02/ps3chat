const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "messages.json");

if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");

function getMessages() {
  return JSON.parse(fs.readFileSync(file));
}

function addMessage(msg) {
  const msgs = getMessages();
  msgs.push(msg);
  fs.writeFileSync(file, JSON.stringify(msgs, null, 2));
}

module.exports = { getMessages, addMessage };
