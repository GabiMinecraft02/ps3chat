const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const config = require("./config");
const users = require("./users");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));
app.use(express.json());

// ======================
// PAGE SECRÈTE
// ======================
app.get("/Ps3Backups", (req, res) => {
  res.sendFile(__dirname + "/public/Ps3Backups.html");
});

// ======================
// SOCKET IP CHECK
// ======================
function getRealIp(socket) {
  const xff = socket.handshake.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return socket.handshake.address;
}

io.use((socket, next) => {
  const ip = getRealIp(socket);
  console.log("Connexion IP :", ip);

  if (!config.whitelist.includes(ip)) {
    console.log("IP refusée :", ip);
    return next(new Error("IP refusée"));
  }

  socket.realIp = ip;
  next();
});

// ======================
// SOCKET LOGIC
// ======================
io.on("connection", (socket) => {
  console.log("Socket connecté :", socket.realIp);

  socket.on("join", ({ pseudo }) => {
    if (!pseudo || pseudo.trim() === "") {
      socket.disconnect();
      return;
    }

    users.addUser(socket.id, pseudo, socket.realIp);

    socket.emit("joined");
    io.emit("users", users.getUsers());
  });

  socket.on("message", (msg) => {
    if (!msg || !msg.text || !msg.pseudo) return;

    const message = {
      pseudo: msg.pseudo,
      text: msg.text,
      time: new Date().toLocaleTimeString()
    };

    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});

// ======================
const PORT = process.env.PORT || 40000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Serveur OK sur port", PORT);
});
