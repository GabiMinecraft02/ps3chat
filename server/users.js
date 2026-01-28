const users = [];

/*
user = {
  socketId,
  pseudo,
  ip,
  inVoice,
  isMuted
}
*/

module.exports = {
  addUser(socketId, pseudo, ip) {
    users.push({
      socketId,
      pseudo,
      ip,
      inVoice: false,
      isMuted: false
    });
  },

  removeUser(socketId) {
    const index = users.findIndex(u => u.socketId === socketId);
    if (index !== -1) users.splice(index, 1);
  },

  setVoice(socketId, inVoice) {
    const user = users.find(u => u.socketId === socketId);
    if (user) user.inVoice = inVoice;
  },

  setMuted(socketId, isMuted) {
    const user = users.find(u => u.socketId === socketId);
    if (user) user.isMuted = isMuted;
  },

  getUsers() {
    return users.map(u => ({
      pseudo: u.pseudo,
      inVoice: u.inVoice,
      isMuted: u.isMuted
    }));
  },

  getUser(socketId) {
    return users.find(u => u.socketId === socketId);
  }
};
