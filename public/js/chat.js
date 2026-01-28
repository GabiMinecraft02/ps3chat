const socket = io("/", {
  transports: ["websocket"]
});

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("msg");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  if (!messageInput.value) return;
  socket.emit("message", {
    pseudo: myPseudo,
    text: messageInput.value
  });
  messageInput.value = "";
}

socket.on("message", addMessage);
socket.on("history", data => data.forEach(addMessage));

function addMessage(msg) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${msg.pseudo}</b>: ${msg.text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
