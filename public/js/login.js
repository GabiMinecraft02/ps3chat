const socket = io();

document.getElementById("login-btn").onclick = () => {
  const pseudo = document.getElementById("pseudo").value;
  const password = document.getElementById("password").value;
  socket.emit("login", { pseudo, password });
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "flex";
};
