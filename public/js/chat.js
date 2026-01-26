const socket = io();

// Éléments DOM
const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const pseudoInput = document.getElementById("pseudo");
const passwordInput = document.getElementById("password");
const msgInput = document.getElementById("msg");
const messagesDiv = document.getElementById("messages");
const usersUl = document.getElementById("users");

const voiceBtn = document.getElementById("voice-btn");
const muteBtn = document.getElementById("mute-btn");
const silenceBtn = document.getElementById("silence-btn");

let localStream = null;
let inVoice = false;
let isMuted = false;
let isSilenced = false;

// --------------------
// LOGIN
// --------------------
function login() {
    const pseudo = pseudoInput.value.trim();
    const password = passwordInput.value.trim();
    if (!pseudo || !password) return alert("Pseudo et mot de passe requis");

    socket.emit("login", { pseudo, password });
}

socket.on("login_error", () => {
    alert("Mot de passe incorrect");
});

socket.on("history", (msgs) => {
    chatDiv.style.display = "flex";
    loginDiv.style.display = "none";
    messagesDiv.innerHTML = "";
    msgs.forEach(m => addMessage(m));
});

// --------------------
// CHAT MESSAGE
// --------------------
function send() {
    const text = msgInput.value.trim();
    if (!text) return;
    socket.emit("message", { user: pseudoInput.value, text });
    msgInput.value = "";
}

socket.on("message", addMessage);

function addMessage(msg) {
    const div = document.createElement("div");
    div.className = "message";
    div.innerHTML = `<b>${msg.user}</b> [${msg.time}]: ${msg.text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// --------------------
// UTILISATEURS
// --------------------
socket.on("users", (list) => {
    usersUl.innerHTML = "";
   
