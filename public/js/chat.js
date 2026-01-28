document.addEventListener("DOMContentLoaded", () => {
  // sécurité
  if (typeof io === "undefined") {
    console.error("socket.io non chargé");
    return;
  }

  const socket = io();

  const messagesDiv = document.getElementById("messages");
  const messageInput = document.getElementById("msg");
  const sendBtn = document.getElementById("send-btn");

  if (!messagesDiv || !messageInput || !sendBtn) {
    console.error("Éléments chat manquants");
    return;
  }

  // réception message
  socket.on("message", msg => {
    addMessage(msg);
  });

  // historique
  socket.on("history", history => {
    messagesDiv.innerHTML = "";
    history.forEach(addMessage);
  });

  // envoi
  sendBtn.onclick = sendMessage;
  messageInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    socket.emit("message", {
      pseudo: window.myPseudo,
      text
    });

    messageInput.value = "";
  }

  function addMessage(msg) {
    const div = document.createElement("div");
    div.innerHTML = `<b>${msg.pseudo}</b> : ${msg.text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});
