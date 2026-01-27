const socket = io();

const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");

const pseudoInput = document.getElementById("pseudo");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const usersUl = document.getElementById("users");

let myPseudo = "";

// Pré-remplissage pseudo par IP
socket.on("prefill_pseudo", pseudo => {
  if (pseudo) pseudoInput.value = pseudo;
});

// LOGIN
loginBtn.onclick = () => {
  socket.emit("login", {
    pseudo: pseudoInput.value,
    password: passwordInput.value
  });
};

socket.on("login_error", () => {
  loginError.style.display = "block";
});

socket.on("history", msgs => {
  loginDiv.style.display = "none";
  chatDiv.style.display = "flex";
  messagesDiv.innerHTML = "";
  msgs.forEach(addMessage);
});

socket.on("message", addMessage);

sendBtn.onclick = sendMessage;
messageInput.onkeydown = e => {
  if (e.key === "Enter") sendMessage();
};

function sendMessage() {
  if (!messageInput.value) return;
  socket.emit("message", {
    user: myPseudo || pseudoInput.value,
    text: messageInput.value
  });
  messageInput.value = "";
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.textContent = `[${msg.time}] ${msg.username}: ${msg.text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// USERS
socket.on("users", users =>
