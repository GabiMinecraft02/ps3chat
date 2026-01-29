const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const config = require("./config");
const users = require("./users");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.static("public"));
app.use(express.json()); // pour app.post

// ======================
// POST LOGIN SIMPLE
// ======================
app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === config.password) return res.json({ ok: true });
  return res.status(401).json({ ok: false });
});

// ======================
// UTIL: IP REAL
// ======================
function getRealIp(socket) {
  const xff = socket.handshake.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return socket.handshake.address;
}

// ======================
// SOCKET EVENTS
// ======================
io.use((socket, next) => {
  const ip = getRealIp(socket);
  console.log("IP détectée :", ip);

  if (!config.whitelist.includes(ip)) {
    console.log("IP non autorisée :", ip);
    return next(new Error("IP refusée"));
  }

  socket.realIp = ip;
  next();
});

io.on("connection", (socket) => {
  console.log("Connecté :", socket.realIp);

  // LOGIN VIA SOCKET
  socket.on("login", async ({ pseudo }) => {
    if (!pseudo) pseudo = config.ipNames[socket.realIp] || "Invité";

    users.addUser(socket.id, pseudo, socket.realIp);

    // Récup messages supabase
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true });

    socket.emit("history", error ? [] : data);
    io.emit("users", users.getUsers());
  });

  // MESSAGE
  socket.on("message", async (msg) => {
    if (!msg.text || !msg.pseudo) return;

    const message = {
      pseudo: msg.pseudo,
      text: msg.text,
      time: new Date().toLocaleTimeString(),
    };

    await supabase.from("messages").insert(message);
    io.emit("message", message);
  });

  // DECONNEXION
  socket.on("disconnect", () => {
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});

// ======================
// START SERVER (RENDER SAFE)
// ======================
const PORT = process.env.PORT || 40000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Serveur lancé sur le port", PORT);
});
