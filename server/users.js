const users = [];

module.exports = {
  addUser(id, pseudo, ip) {
    users.push({ socketId: id, pseudo, ip });
  },

  removeUser(id) {
    const index = users.findIndex(u => u.socketId === id);
    if (index !== -1) users.splice(index, 1);
  },

  getUsers() {
    return users;
  }
};
