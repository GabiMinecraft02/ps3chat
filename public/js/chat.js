const socket = io();

// DOM
const loginDiv = document.getElementById("login");
const chatContainer = document.getElementById("chat-container");
const pseudoInput = document.getElementById("pseudo");
const passwordInput = document.getElementById("password");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("msg");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const muteBtn = document.getElementById("mute-btn");
const usersList = document.getElementById("users");

let myPseudo = "";
let localStream = null;
let isMuted = true;
let inVoice = false;

// --------------------
// LOGIN
// --------------------
function login() {
  const pseudo = pseudoInput.value.trim();
  const password = passwordInput.value.trim();
  if (!pseudo || !password) return alert("Pseudo et mot de passe requis");
  
  socket.emit("login", { pseudo, password });
  myPseudo = pseudo;
}

socket.on("login_error", () => alert("Mot de passe incorrect"));

socket.on("history", data => {
  loginDiv.style.display = "none";
  chatContainer.style.display = "flex";
  messagesDiv.innerHTML = "";
  data.forEach(addMessage);
});

// --------------------
// USERS
// --------------------
socket.on("users", list => {
  usersList.innerHTML = "";
  list.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.pseudo;

    const status = document.createElement("span");
    status.className = "status";

    if (u.isMuted) status.textContent = "🔇";
    else if (u.inVoice) status.textContent = "🔊";
    else status.textContent = "🔈";

    li.appendChild(status);
    usersList.appendChild(li);
  });
});

// --------------------
// MESSAGES
// --------------------
socket.on("message", addMessage);

sendBtn.onclick = sendMessage;
messageInput.onkeydown = e => {
  if (e.key === "Enter") sendMessage();
};

function sendMessage() {
  if (!messageInput.value) return;

  socket.emit("message", {
    pseudo: myPseudo,
    text: messageInput.value
  });

  messageInput.value = "";
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${msg.pseudo}</b>: ${msg.text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// --------------------
// VOCAL
// --------------------
voiceBtn.onclick = async () => {
  if (inVoice) return stopVoice();

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    inVoice = true;
    isMuted = false;
    muteBtn.textContent = "🔇 Muet";

    socket.emit("joinVoice");

    // ajoute notre flux à la page via webrtc.js
    addLocalStream(localStream);

  } catch (err) {
    alert("Impossible d’accéder au micro : " + err.message);
  }
};

muteBtn.onclick = () => {
  if (!localStream) return;
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteBtn.textContent = isMuted ? "🔇 Muet" : "🎤 Actif";
  socket.emit(isMuted ? "leaveVoice" : "joinVoice");
};

function stopVoice() {
  if (!localStream) return;
  localStream.getTracks().forEach(t => t.stop());
  inVoice = false;
  isMuted = true;
  muteBtn.textContent = "🔇 Muet";
  socket.emit("leaveVoice");
}
