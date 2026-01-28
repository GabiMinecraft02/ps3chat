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

// --------------------
// SUPABASE
// --------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// --------------------
// STATIC FILES
// --------------------
app.use(express.static("public"));

// --------------------
// IP WHITELIST
// --------------------
io.use((socket, next) => {
  const ip =
    socket.handshake.headers["x-forwarded-for"]?.split(",")[0] ||
    socket.handshake.address;

  console.log("IP détectée :", ip);

  if (!config.whitelist.some(w => ip.includes(w))) {
    console.log("IP refusée :", ip);
    return next(new Error("IP refusée"));
  }

  socket.realIp = ip;
  next();
});

// --------------------
// SOCKET.IO
// --------------------
io.on("connection", socket => {
  console.log("Connecté :", socket.realIp);

  // -------- LOGIN --------
  socket.on("login", async ({ pseudo, password }) => {
    if (password !== config.password) {
      socket.emit("login_error");
      return;
    }

    // IP -> pseudo forcé si présent
    const forcedPseudo = config.ipNames[socket.realIp];
    const finalPseudo = forcedPseudo || pseudo;

    users.addUser(socket.id, finalPseudo, socket.realIp);

    // Historique messages
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true });

    socket.emit("login_ok", {
      pseudo: finalPseudo,
      messages: data || []
    });

    io.emit("users", users.getUsers());
  });

  // -------- MESSAGE --------
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

  // -------- DISCONNECT --------
  socket.on("disconnect", () => {
    users.removeUser(socket.id);
    io.emit("users", users.getUsers());
  });
});

// --------------------
// LISTEN (RENDER OK)
// --------------------
const PORT = process.env.PORT || 40000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Serveur démarré sur le port", PORT);
});
