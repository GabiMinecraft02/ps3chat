// chat.js
document.addEventListener("DOMContentLoaded", () => {
  const messagesDiv = document.getElementById("messages");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const usersList = document.getElementById("usersList");

  // Récupère pseudo depuis le login ou demande si absent
  let myPseudo = localStorage.getItem("pseudo");
  if (!myPseudo) {
    myPseudo = prompt("Entrez votre pseudo");
    localStorage.setItem("pseudo", myPseudo);
  }

  // Affiche l'historique si présent
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.forEach(addMessage);

  // Envoyer un message
  sendBtn.onclick = sendMessage;
  messageInput.onkeydown = e => {
    if (e.key === "Enter") sendMessage();
  };

  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    socket.emit("message", {
      pseudo: myPseudo,
      text: text
    });

    messageInput.value = "";
  }

  // Affichage message reçu
  socket.on("message", addMessage);

  function addMessage(msg) {
    const div = document.createElement("div");
    div.className = "message";
    div.innerHTML = `<b>${msg.pseudo}</b> : ${msg.text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Liste des utilisateurs connectés
  socket.on("users", users => {
    if (!usersList) return;
    usersList.innerHTML = "";
    users.forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.pseudo} (${u.ip})`;
      usersList.appendChild(li);
    });
  });
});
