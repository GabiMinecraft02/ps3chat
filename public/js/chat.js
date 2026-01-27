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
let inVoice = false;
let isMuted = false;

// --------------------
// LOGIN
// --------------------
loginBtn.onclick = () => {
  myPseudo = pseudoInput.value;
  socket.emit("login", {
    pseudo: myPseudo,
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

socket.emit("message", {
  username: myPseudo,
  text: messageInput.value
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
  if (!messageInput.value.trim()) return;

  socket.emit("message", {
    pseudo: myPseudo,
    text: messageInput.value
  });

  messageInput.value = "";
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `<b>${msg.pseudo}</b> : ${msg.text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// --------------------
// USERS + ICÔNES
// --------------------
socket.on("users", list => {
  usersUl.innerHTML = "";

  list.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.pseudo + " ";

    const icon = document.createElement("span");

    if (u.isMuted) icon.textContent = "🔇";
    else if (u.inVoice) icon.textContent = "🔊";
    else icon.textContent = "🔈";

    li.appendChild(icon);
    usersUl.appendChild(li);
  });
});
