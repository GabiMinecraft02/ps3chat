const users = new Map();

module.exports = {
  addUser(id, pseudo, ip) {
    users.set(id, { id, pseudo, ip, inVoice: false, isMuted: false });
  },
  removeUser(id) {
    users.delete(id);
  },
  getUsers() {
    return Array.from(users.values());
  },
  getPseudoByIp(ip, config) {
    for (const key in config.ipPseudo) {
      if (ip.startsWith(key)) return config.ipPseudo[key];
    }
    return "";
  }
};
