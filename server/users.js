const users = {};
const ipMap = {};

function addUser(socketId, pseudo, ip) {
  ipMap[ip] = pseudo;
  users[socketId] = { socketId, pseudo };
}

function removeUser(socketId) {
  delete users[socketId];
}

function getUsers() {
  return Object.values(users);
}

function getPseudoByIp(ip, config) {
  return ipMap[ip] || config.ipPseudos[ip] || "";
}

module.exports = {
  addUser,
  removeUser,
  getUsers,
  getPseudoByIp
};
