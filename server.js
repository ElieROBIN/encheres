const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Chemin du dossier public (avec les interfaces)
app.use(express.static(path.join(__dirname, "public")));

// Quand quelqu’un envoie une enchère
io.on("connection", (socket) => {
  console.log("Nouvel utilisateur connecté");

  socket.on("newBid", (bidValue) => {
    console.log("Nouvelle enchère reçue :", bidValue);
    io.emit("updateBid", bidValue); // envoie à tous les clients connectés
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
