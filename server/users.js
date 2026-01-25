const users = {};

function addUser(socketId, pseudo, ip) {
  users[socketId] = { pseudo, ip };
}

function removeUser(socketId) {
  delete users[socketId];
}

function getUsers() {
  return Object.values(users);
}

module.exports = { addUser, removeUser, getUsers };
