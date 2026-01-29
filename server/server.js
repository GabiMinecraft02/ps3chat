const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const config = require("./config");
const users = require("./users");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(express.static("public"));

/* ======================
   IP REAL (RENDER SAFE)
====================== */
function getRealIp(socket) {
  const xff = socket.handshake.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return socket.handshake.address;
}

/* ======================
   SOCKET AUTH
====================== */
io.use((socket, next) => {
  socket.realIp = getRealIp(socket);
  console.log("IP détectée :", socket.realIp);
  next();
});

/* ======================
   LOGIN SIMPLE HTTP
====================== */
app.use(express.json());

app.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === config.password) {
    return res.json({ ok: true });
  }

  res.status(401).json({ ok: false });
});

/* ======================
   SOCKET EVENTS
====================== */
io.on("connection", (socket) => {
  console.log("Connecté :", socket.realIp);

  // Ajouter les users
  socket.on("join", ({ pseudo }) => {
    users.addUser(socket.id, pseudo, socket.realIp);
    io.emit("users", users.getUsers());
  });

  // Messages
  socket.on("message", async (msg) => {
    if (!msg.text || !msg.pseudo) return;

    const message = {
      pseudo: msg.pseudo,
      text: msg.text,
      time: new Date().toLocaleTimeString()
    };

    await supabase.from("messages").insert(message);
    io.emit("message", message);
  });

  // Disconnect
  socket.on("disconnect", () => {
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});


  /* -------- MESSAGE -------- */
  socket.on("message", async ({ pseudo, text }) => {
    if (!pseudo || !text) return;

    const message = {
      pseudo,
      text,
      time: new Date().toLocaleTimeString()
    };

    await supabase.from("messages").insert(message);
    io.emit("message", message);
  });

  /* -------- DISCONNECT -------- */
  socket.on("disconnect", () => {
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});

/* ======================
   START SERVER (RENDER)
====================== */
const PORT = process.env.PORT || 40000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Serveur lancé sur le port", PORT);
});
