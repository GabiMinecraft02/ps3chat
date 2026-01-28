const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const config = require("./config");
const users = require("./users");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --------------------
// Supabase
// --------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// --------------------
// Static files
// --------------------
app.use(express.static("public"));

// --------------------
// IP Whitelist
// --------------------
io.use((socket, next) => {
  const ip =
    socket.handshake.headers["x-forwarded-for"] ||
    socket.handshake.address;

  if (!config.whitelist.some(w => ip.includes(w))) {
    console.log("IP refusée :", ip);
    return next(new Error("IP refusée"));
  }

  socket.realIp = ip;
  next();
});

// --------------------
// Connexion Socket
// --------------------
io.on("connection", socket => {
  console.log("Connexion :", socket.realIp);

  // --------------------
  // LOGIN
  // --------------------
  socket.on("login", async ({ pseudo, password }) => {
    if (password !== config.password) {
      socket.emit("login_error");
      return;
    }

    // Sécurité pseudo
    if (!pseudo || !pseudo.trim()) {
      pseudo = "Invité";
    }

    users.addUser(socket.id, pseudo, socket.realIp);

    // -------- Historique messages --------
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Supabase history error:", error);
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
    const user = users.getUser(socket.id);
    if (!user) return;

    if (!msg.text || !msg.text.trim()) return;

    const message = {
      username: user.pseudo, // 👈 PLUS JAMAIS undefined
      text: msg.text,
      time: new Date().toLocaleTimeString()
    };

    const { error } = await supabase
      .from("messages")
      .insert(message);

    if (error) {
      console.error("Supabase insert error:", error);
      return;
    }

    io.emit("message", message);
  });

  // --------------------
  // VOCAL (état seulement)
  // --------------------
  socket.on("joinVoice", () => {
    users.setVoice(socket.id, true);
    users.setMuted(socket.id, false);
    io.emit("users", users.getUsers());
  });

  socket.on("leaveVoice", () => {
    users.setVoice(socket.id, false);
    io.emit("users", users.getUsers());
  });

  socket.on("mute", isMuted => {
    users.setMuted(socket.id, isMuted);
    io.emit("users", users.getUsers());
  });

  // --------------------
  // DECONNEXION
  // --------------------
  socket.on("disconnect", () => {
    console.log("Déconnexion :", socket.realIp);
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});

// --------------------
// Lancement serveur
// --------------------
const PORT = process.env.PORT || 40000;
server.listen(PORT, () => {
  console.log("PS3CHAT lancé sur le port", PORT);
});
