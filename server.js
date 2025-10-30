const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_CLIENTS = 100; // 🔒 nombre maximum d’utilisateurs autorisés

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
    io.currentBid = 1; // prix initial
  }
  if (typeof io.currentBidderName === "undefined") {
    io.currentBidderName = null;
  }

  // Informer le nouveau client de la valeur actuelle
  socket.emit("updateBid", { amount: io.currentBid, name: io.currentBidderName, inc: null });

  // Quand quelqu’un envoie une nouvelle enchère
  socket.on("newBid", (payload) => {
    // payload attendu: { amount, name }
    const amount = payload && typeof payload === "object" ? payload.amount : payload;
    const name = payload && typeof payload === "object" ? payload.name : null;
    const inc = payload && typeof payload === "object" ? payload.inc : null;
    const numericBid = typeof amount === "number" ? amount : parseFloat(amount);

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
    io.currentBidderName = (typeof name === "string" && name.trim()) ? name.trim() : null;
    const incToSend = typeof inc === "number" ? inc : null;
    console.log(
      "Nouvelle enchère acceptée :",
      numericBid,
      io.currentBidderName ? `par ${io.currentBidderName}` : "",
      incToSend ? `(+${incToSend})` : ""
    );
    io.emit("updateBid", { amount: numericBid, name: io.currentBidderName, inc: incToSend }); // envoie à tous les clients
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
