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
  // État en mémoire de l'enchère courante
  if (typeof io.currentBid === "undefined") {
    io.currentBid = null;
  }

  socket.on("newBid", (bidValue) => {
    const numericBid = typeof bidValue === "number" ? bidValue : parseFloat(bidValue);

    if (Number.isNaN(numericBid)) {
      socket.emit("bidRejected", { reason: "Montant invalide." });
      return;
    }

    if (io.currentBid !== null && numericBid <= io.currentBid) {
      socket.emit("bidRejected", { reason: `L'enchère doit être strictement supérieure à ${io.currentBid}.` });
      return;
    }

    io.currentBid = numericBid;
    console.log("Nouvelle enchère acceptée :", numericBid);
    io.emit("updateBid", numericBid); // envoie à tous les clients connectés
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
