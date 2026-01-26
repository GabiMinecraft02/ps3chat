const socket = io();

// --------------------
// DOM
// --------------------
const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const pseudoInput = document.getElementById("pseudo");
const passwordInput = document.getElementById("password");
const msgInput = document.getElementById("msg");
const usersUl = document.getElementById("users");
const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("send-btn");

// Variables
let myPseudo = "";
let myIP = "";

// --------------------
// Login
// --------------------
async function login() {
    const pseudo = pseudoInput.value.trim();
    const password = passwordInput.value;

    if (!pseudo || !password) return alert("Remplis pseudo et mot de passe");

    socket.emit("login", { pseudo, password });
}

socket.on("login_error", () => {
    alert("Mot de passe incorrect");
});

socket.on("users", list => {
    usersUl.innerHTML = "";
    list.forEach(u => {
        const li = document.createElement("li");
        li.dataset.pseudo = u.pseudo;
        li.textContent = u.pseudo + " ";

        const status = document.createElement("span");
        status.className = "status";

        // Icône selon vocal
        if (u.isMuted) status.textContent = "🔇";
        else if (u.inVoice) status.textContent = "🔊";
        else status.textContent = "🔈";

        li.appendChild(status);
        usersUl.appendChild(li);

        // Pré-remplir pseudo si même IP
        if (u.ip === myIP && !myPseudo) {
            myPseudo = u.pseudo;
            pseudoInput.value = myPseudo;
        }
    });
});

// --------------------
// Historique messages
// --------------------
socket.on("history", messages => {
    messagesDiv.innerHTML = "";
    messages.forEach(m => addMessage(m.username, m.text, m.time));
});

// --------------------
// Nouveau message
// --------------------
socket.on("message", m => addMessage(m.username, m.text, m.time));

function addMessage(user, text, time) {
    const div = document.createElement("div");
    div.innerHTML = `<b>${user}</b> [${time}]: ${text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// --------------------
// Envoyer message
// --------------------
function send() {
    const text = msgInput.value.trim();
    if (!text) return;
    socket.emit("message", { user: pseudoInput.value, text });
    msgInput.value = "";
}

// --------------------
// Connexion réussie
// --------------------
socket.on("login_success", ({ ip }) => {
    loginDiv.style.display = "none";
    chatDiv.style.display = "flex";
    myIP = ip;
});

// --------------------
// Envoyer pseudo automatiquement
// --------------------
pseudoInput.addEventListener("change", () => {
    myPseudo = pseudoInput.value;
});
