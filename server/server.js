const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const config = require("./config");
const users = require("./users");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(express.static("public"));

// --------------------
// WHITELIST IP
// --------------------
io.use((socket, next) => {
  const ip =
    socket.handshake.headers["x-forwarded-for"] ||
    socket.handshake.address;

  if (!config.whitelist.some(w => ip.includes(w))) {
    return next(new Error("IP refusée"));
  }

  socket.realIp = ip;
  next();
});

// --------------------
// SOCKETS
// --------------------
io.on("connection", socket => {
  console.log("Connecté :", socket.realIp);

  socket.on("login", async ({ pseudo, password }) => {
    if (password !== config.password) {
      socket.emit("login_error");
      return;
    }

    // Associer IP ↔ pseudo
    users.addUser(socket.id, pseudo, socket.realIp);

    // Historique
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true });

    socket.emit("history", data || []);
    io.emit("users", users.getUsers());
  });

  socket.on("message", async msg => {
    if (!msg.text || !msg.pseudo) return;

    const message = {
      pseudo: msg.pseudo,
      text: msg.text,
      time: new Date().toLocaleTimeString()
    };

    await supabase.from("messages").insert(message);
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});

server.listen(process.env.PORT || 40000, () => {
  console.log("Serveur démarré");
});

