const socket = io();
let pseudo = "";
let localStream;
let isMuted = false;
let inVoice = false;
let muteAll = false;

// ----- LOGIN -----
function login() {
  pseudo = document.getElementById("pseudo").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!pseudo || !password) {
    alert("Remplis pseudo et mot de passe !");
    return;
  }

  socket.emit("login", { pseudo, password });
}

socket.on("login_error", () => alert("Mot de passe incorrect"));

socket.on("history", msgs => {
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "flex";
  msgs.forEach(addMessage);
});

// ----- CHAT -----
socket.on("message", addMessage);

socket.on("users", list => {
  const ul = document.getElementById("users");
  ul.innerHTML = "";
  list.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.pseudo;

    const status = document.createElement("span");
    status.className = "status";

    // Icônes selon le statut
    if (u.isMuted) status.textContent = "🔇";     // muet
    else if (u.inVoice) status.textContent = "🔊"; // micro actif
    else status.textContent = "🔈";               // connecté mais pas actif

    li.appendChild(status);
    ul.appendChild(li);
  });
});

// ----- ENVOI MESSAGE -----
function send() {
  const msgInput = document.getElementById("msg");
  const text = msgInput.value.trim();
  if (!text) return;

  socket.emit("message", { user: pseudo, text });
  msgInput.value = "";
}

function addMessage(msg) {
  if (!msg.text || msg.text.trim() === "") return;

  const div = document.createElement("div");
  div.className = "message";

  const timeSpan = document.createElement("span");
  timeSpan.className = "time";
  timeSpan.textContent = `[${msg.time}]`;

  const userSpan = document.createElement("span");
  userSpan.className = "user";
  userSpan.textContent = msg.user;

  const textSpan = document.createElement("span");
  textSpan.textContent = ": " + msg.text;

  div.appendChild(timeSpan);
  div.appendChild(userSpan);
  div.appendChild(textSpan);

  const messagesDiv = document.getElementById("messages");
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ----- MICRO / VOCAL -----
const voiceBtn = document.getElementById("voice-btn");
const muteBtn = document.getElementById("mute-btn");
const muteAllBtn = document.getElementById("mute-all-btn");
const micSelect = document.getElementById("mic-select");

// Lister micros disponibles
async function listAudioDevices() {
  try {
    // Demande permission micro pour iOS / Android / PC
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === "audioinput");
  } catch (err) {
    console.error("Erreur accès micro :", err);
    return [];
  }
}

async function populateMicList() {
  const mics = await listAudioDevices();
  micSelect.innerHTML = "";
  if (mics.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Aucun micro trouvé";
    micSelect.appendChild(option);
    return;
  }

  mics.forEach((mic, i) => {
    const option = document.createElement("option");
    option.value = mic.deviceId;
    option.textContent = mic.label || `Micro ${i + 1}`;
    micSelect.appendChild(option);
  });
}
populateMicList();

// Rejoindre le vocal (fonctionne sur mobile et desktop)
voiceBtn.onclick = async () => {
  if (inVoice) return;

  try {
    // Opera / Chromium : demande le micro par défaut
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    if (!localStream || localStream.getAudioTracks().length === 0) {
      alert("Aucun micro détecté !");
      return;
    }

    // Micro actif
    inVoice = true;
    isMuted = false;
    muteBtn.textContent = "🎤 Actif";

    // Prévenir serveur pour icône 🔊
    socket.emit("joinVoice");

  } catch (err) {
    alert("Impossible d’accéder au micro. Vérifie la permission et que le micro est branché.");
    console.error(err);
  }
};

// Activer / désactiver son micro
muteBtn.onclick = () => {
  if (!localStream) return;

  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteBtn.textContent = isMuted ? "🔇 Muet" : "🎤 Actif";

  // Prévenir le serveur pour mettre à jour l'icône
  if (isMuted) socket.emit("leaveVoice");
  else socket.emit("joinVoice");
};

// Bouton sourdine globale (mute tous les flux)
muteAllBtn.onclick = () => {
  muteAll = !muteAll;
  muteAllBtn.textContent = muteAll ? "🔇 Tout muet" : "🔊 Audio";
  document.querySelectorAll("audio.remote").forEach(a => a.muted = muteAll);
};
