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

app.use(express.static("public"));

// --------------------
// Nettoyage IP
// --------------------
function cleanIp(ip) {
  if (!ip) return "";
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  if (ip === "::1") return "127.0.0.1";
  return ip;
}

// --------------------
// Whitelist IP
// --------------------
io.use((socket, next) => {
  const ip = cleanIp(socket.handshake.address);
  console.log("Connexion IP :", ip);

  if (!config.whitelist.some(w => ip.startsWith(w))) {
    console.log("IP refusée :", ip);
    return next(new Error("IP refusée"));
  }
  next();
});

// --------------------
// Connexions
// --------------------
io.on("connection", socket => {
  const ip = cleanIp(socket.handshake.address);

  // pseudo par IP
  const defaultPseudo = users.getPseudoByIp(ip, config);
  socket.emit("defaultPseudo", defaultPseudo);

  // --------------------
  // LOGIN
  // --------------------
  socket.on("login", async ({ pseudo, password }) => {
    if (password !== config.password) {
      socket.emit("login_error");
      return;
    }

    users.addUser(socket.id, pseudo, ip);

    // Historique messages
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true })
      .limit(100);

    socket.emit("history", error ? [] : data);
    io.emit("users", users.getUsers());
  });

  // --------------------
  // MESSAGE TEXTE
  // --------------------
  socket.on("message", async msg => {
    if (!msg.text) return;

    const message = {
      username: msg.user,
      text: msg.text,
      time: new Date().toLocaleTimeString()
    };

    await supabase.from("messages").insert(message);
    io.emit("message", message);
  });

  // --------------------
  // WEBRTC SIGNALISATION
  // --------------------
  socket.on("webrtc-offer", data => {
    socket.broadcast.emit("webrtc-offer", {
      from: socket.id,
      offer: data.offer
    });
  });

  socket.on("webrtc-answer", data => {
    socket.broadcast.emit("webrtc-answer", {
      from: socket.id,
      answer: data.answer
    });
  });

  socket.on("webrtc-candidate", data => {
    socket.broadcast.emit("webrtc-candidate", {
      from: socket.id,
      candidate: data.candidate
    });
  });

  socket.on("voiceSpeaking", speaking => {
    socket.broadcast.emit("voiceSpeaking", {
      id: socket.id,
      speaking
    });
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
