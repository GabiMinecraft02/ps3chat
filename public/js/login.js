// socket GLOBAL (obligatoire)
const socket = io();

// éléments DOM
const loginBtn = document.getElementById("login-btn");
const pseudoInput = document.getElementById("pseudo");
const passwordInput = document.getElementById("password");
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");

// --------------------
// FONCTION LOGIN (GLOBALE)
// --------------------
window.login = function () {
  const pseudo = pseudoInput.value.trim();
  const password = passwordInput.value.trim();

  if (!pseudo || !password) {
    alert("Pseudo ou mot de passe manquant");
    return;
  }

  socket.emit("login", { pseudo, password });
};

// --------------------
// CLICK BOUTON
// --------------------
if (loginBtn) {
  loginBtn.onclick = login;
}

// --------------------
// LOGIN OK
// --------------------
socket.on("history", messages => {
  loginContainer.style.display = "none";
  chatContainer.style.display = "block";
});

// --------------------
// LOGIN ERREUR
// --------------------
socket.on("login_error", () => {
  alert("Mot de passe incorrect");
});
