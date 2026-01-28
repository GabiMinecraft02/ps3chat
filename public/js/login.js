const socket = io();

const pseudoInput = document.getElementById("pseudo");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const errorDiv = document.getElementById("error");

// Pseudo auto depuis IP si dispo
if (localStorage.getItem("pseudo")) {
  pseudoInput.value = localStorage.getItem("pseudo");
}

loginBtn.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  const password = passwordInput.value;

  if (!pseudo || !password) return;

  localStorage.setItem("pseudo", pseudo);

  socket.emit("login", { pseudo, password });
};

socket.on("login_error", () => {
  errorDiv.style.display = "block";
});

socket.on("history", () => {
  // login OK → chat
  window.location.href = "/";
});
