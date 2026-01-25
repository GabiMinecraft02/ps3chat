const users = []; // { socketId, ip, pseudo, inVoice, isMuted }

function getPseudoByIp(ip) {
  const u = users.find(u => u.ip === ip);
  return u ? u.pseudo : "Invité";
}

function addUser(socketId, pseudo, ip) {
  const existing = users.find(u => u.ip === ip);
  if (existing) {
    existing.socketId = socketId;
    existing.pseudo = pseudo || existing.pseudo; // garde pseudo existant si pas changé
  } else {
    users.push({ socketId, ip, pseudo: pseudo || "Invité", inVoice: false, isMuted: false });
  }
}

function updateUserPseudo(socketId, pseudo) {
  const u = users.find(u => u.socketId === socketId);
  if (u) u.pseudo = pseudo;
}

function removeUser(socketId) {
  const idx = users.findIndex(u => u.socketId === socketId);
  if (idx !== -1) users.splice(idx, 1);
}

function getUsers() {
  return users;
}

module.exports = { addUser, removeUser, updateUserPseudo, getUsers, getPseudoByIp };
