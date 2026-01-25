const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const config = require("./config");
const users = require("./users");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(express.static("public"));

// --------------------
// Whitelist IP
// --------------------
io.use((socket, next) => {
  const ip = socket.handshake.address;
  if (!config.whitelist.some(w => ip.includes(w))) {
    return next(new Error("IP refusée"));
  }
  next();
});

// --------------------
// Connexions
// --------------------
io.on("connection", socket => {
  console.log("Connexion :", socket.handshake.address);

  // --------------------
  // SIGNALISATION WEBRTC
  // --------------------
  socket.on("webrtc-offer", offer => {
    socket.broadcast.emit("webrtc-offer", offer);
  });

  socket.on("webrtc-answer", answer => {
    socket.broadcast.emit("webrtc-answer", answer);
  });

  socket.on("webrtc-candidate", candidate => {
    socket.broadcast.emit("webrtc-candidate", candidate);
  });

  // --------------------
  // LOGIN
  // --------------------
  socket.on("login", async ({ pseudo, password }) => {
    if (password !== config.password) {
      socket.emit("login_error");
      return;
    }

    users.addUser(socket.id, pseudo, socket.handshake.address);

    // Historique messages (100 derniers)
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Erreur Supabase history :", error);
      socket.emit("history", []);
    } else {
      socket.emit("history", data);
    }

    io.emit("users", users.getUsers());
  });

  // --------------------
  // MESSAGE
  // --------------------
  socket.on("message", async msg => {
    if (!msg.text) return;

    const message = {
      username: msg.user,
      text: msg.text,
      time: new Date().toLocaleTimeString()
    };

    const { error } = await supabase
      .from("messages")
      .insert(message);

    if (error) {
      console.error("Erreur Supabase insert :", error);
      return;
    }

    io.emit("message", message);
  });

  // --------------------
  // DECONNEXION
  // --------------------
  socket.on("disconnect", () => {
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});

// --------------------
// Lancement serveur
// --------------------
const PORT = process.env.PORT || 40000;
server.listen(PORT, () => {
  console.log("Serveur lancé sur le port", PORT);
});
