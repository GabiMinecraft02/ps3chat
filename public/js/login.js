document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const pseudoInput = document.getElementById("pseudo");
  const passwordInput = document.getElementById("password");

  loginBtn.addEventListener("click", login);

  function login() {
    const pseudo = pseudoInput.value.trim();
    const password = passwordInput.value.trim();
    if (!pseudo || !password) return alert("Pseudo et mot de passe requis");

    socket.emit("login", { pseudo, password });
  }
  window.login = login

  socket.on("login_error", () => {
    alert("Mot de passe incorrect");
  });

  socket.on("history", messages => {
    localStorage.setItem("history", JSON.stringify(messages));
    window.location.href = "chat.html"; // Redirection après login
  });
});

