const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const config = require("./config");
const users = require("./users");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware JSON + statique
app.use(express.json());
app.use(express.static("public"));

// ======================
// UTIL: IP réelle pour Socket.IO
// ======================
function getRealIp(socket) {
  const xff = socket.handshake.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return socket.handshake.address;
}

// ======================
// LOGIN HTTP SIMPLE
// ======================
app.post("/login", (req, res) => {
  const { password } = req.body;
  const ip = req.ip;

  // Vérification IP
  if (!config.whitelist.includes(ip)) {
    return res.status(403).send("IP non autorisée");
  }

  if (password === config.password) {
    return res.redirect("/index.html"); // redirection vers le chat
  }

  res.status(401).send("Mot de passe incorrect");
});

// ======================
// Pages supplémentaires (ex: Ps3Backups)
// ======================
app.get("/Ps3Backups", (req, res) => {
  res.sendFile(__dirname + "/public/Ps3Backups.html");
});

// Variante générique si tu veux éviter de créer une route par page
// app.get("/:page", (req, res) => {
//   const page = req.params.page;
//   res.sendFile(__dirname + `/public/${page}.html`);
// });

// ======================
// SOCKET.IO
// ======================
io.use((socket, next) => {
  const ip = getRealIp(socket);
  console.log("IP détectée :", ip);

  if (!config.whitelist.includes(ip)) {
    console.log("IP refusée :", ip);
    return next(new Error("IP refusée"));
  }

  socket.realIp = ip;
  next();
});

io.on("connection", (socket) => {
  console.log("Connecté :", socket.realIp);

  socket.on("login", async ({ pseudo }) => {
    const ip = socket.realIp;
    if (config.ipNames[ip]) pseudo = config.ipNames[ip];
    users.addUser(socket.id, pseudo, ip);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("id", { ascending: true });
      if (error) console.error("Supabase history:", error);
      socket.emit("history", data || []);
    } catch (err) {
      console.error("Erreur Supabase:", err);
      socket.emit("history", []);
    }

    io.emit("users", users.getUsers());
  });

  socket.on("message", async (msg) => {
    if (!msg.text || !msg.pseudo) return;
    const message = {
      pseudo: msg.pseudo,
      text: msg.text,
      time: new Date().toLocaleTimeString(),
    };
    try {
      await supabase.from("messages").insert(message);
    } catch (err) {
      console.error("Erreur insert Supabase:", err);
    }
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 40000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
