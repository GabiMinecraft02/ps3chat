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
    origin: "*"
  }
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
  const ip = getRealIp(socket);
  console.log("IP détectée :", ip);

  // 🔴 désactivé volontairement (Render)
  // if (!config.whitelist.includes(ip)) {
  //   return next(new Error("IP refusée"));
  // }

  socket.realIp = ip;
  next();
});

/* ======================
   SOCKET EVENTS
====================== */
io.on("connection", socket => {
  console.log("Connecté :", socket.realIp);

  socket.on("login", async ({ pseudo, password }) => {
    if (password !== config.password) {
      socket.emit("login_error");
      return;
    }

    users.addUser(socket.id, pseudo, socket.realIp);

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

/* ======================
   START SERVER (RENDER)
====================== */
const PORT = process.env.PORT || 40000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Serveur lancé sur le port", PORT);
});
