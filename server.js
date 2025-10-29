const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_CLIENTS = 5; // 🔒 nombre maximum d’utilisateurs autorisés

// Dossier public
app.use(express.static(path.join(__dirname, "public")));

// Gestion des connexions
io.on("connection", (socket) => {
  const connectedClients = io.engine.clientsCount;

  // Si le nombre max est atteint, on rejette la connexion
  if (connectedClients > MAX_CLIENTS) {
    console.log("Connexion refusée : limite atteinte.");
    socket.emit("serverFull", {
      message: "Le serveur est plein. Réessayez plus tard.",
    });
    socket.disconnect(true);
    return;
  }

  console.log(`Nouvel utilisateur connecté (${connectedClients}/${MAX_CLIENTS})`);

  // Initialisation de l’enchère courante
  if (typeof io.currentBid === "undefined") {
    io.currentBid = null;
  }

  // Quand quelqu’un envoie une nouvelle enchère
  socket.on("newBid", (bidValue) => {
    const numericBid = typeof bidValue === "number" ? bidValue : parseFloat(bidValue);

    if (Number.isNaN(numericBid)) {
      socket.emit("bidRejected", { reason: "Montant invalide." });
      return;
    }

    if (io.currentBid !== null && numericBid <= io.currentBid) {
      socket.emit("bidRejected", {
        reason: `L'enchère doit être strictement supérieure à ${io.currentBid}.`,
      });
      return;
    }

    io.currentBid = numericBid;
    console.log("Nouvelle enchère acceptée :", numericBid);
    io.emit("updateBid", numericBid); // envoie à tous les clients connectés
  });

  // Quand quelqu’un se déconnecte
  socket.on("disconnect", () => {
    console.log(`Utilisateur déconnecté (${io.engine.clientsCount}/${MAX_CLIENTS})`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});




// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const path = require("path");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// // Chemin du dossier public (avec les interfaces)
// app.use(express.static(path.join(__dirname, "public")));

// // Quand quelqu’un envoie une enchère
// io.on("connection", (socket) => {
//   console.log("Nouvel utilisateur connecté");
//   // État en mémoire de l'enchère courante
//   if (typeof io.currentBid === "undefined") {
//     io.currentBid = null;
//   }

//   socket.on("newBid", (bidValue) => {
//     const numericBid = typeof bidValue === "number" ? bidValue : parseFloat(bidValue);

//     if (Number.isNaN(numericBid)) {
//       socket.emit("bidRejected", { reason: "Montant invalide." });
//       return;
//     }

//     if (io.currentBid !== null && numericBid <= io.currentBid) {
//       socket.emit("bidRejected", { reason: `L'enchère doit être strictement supérieure à ${io.currentBid}.` });
//       return;
//     }

//     io.currentBid = numericBid;
//     console.log("Nouvelle enchère acceptée :", numericBid);
//     io.emit("updateBid", numericBid); // envoie à tous les clients connectés
//   });
// });

// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//   console.log(`Serveur lancé sur http://localhost:${PORT}`);
// });
