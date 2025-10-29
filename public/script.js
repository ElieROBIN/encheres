const socket = io();

const enchereDiv = document.getElementById("enchere-actuelle");
const historiqueUl = document.getElementById("historique");

const nomInput = document.getElementById("nom");
const montantInput = document.getElementById("montant");
const envoyerBtn = document.getElementById("envoyer");

// Si on est sur la page du projecteur
if (enchereDiv) {
  socket.on("etat_initial", ({ enchereActuelle, historique }) => {
    majAffichage(enchereActuelle, historique);
  });

  socket.on("maj_enchere", ({ enchereActuelle, historique }) => {
    majAffichage(enchereActuelle, historique);
  });

  function majAffichage(enchere, histo) {
    enchereDiv.textContent = enchere
      ? `${enchere.nom} - ${enchere.montant}€`
      : "Aucune enchère";
    historiqueUl.innerHTML = histo
      .map((e, i, arr) => {
        const prevMontant = i > 0 && arr[i - 1] && typeof arr[i - 1].montant === "number"
          ? arr[i - 1].montant
          : 0;
        const diff = typeof e.montant === "number" ? (e.montant - prevMontant) : 0;
        const allowed = [50, 125, 250, 500];
        const inc = allowed.includes(diff) ? diff : diff;
        return `<li>${e.nom} - +${inc}</li>`;
      })
      .join("");
  }
}

// Si on est sur la page du jury
if (envoyerBtn) {
  envoyerBtn.addEventListener("click", () => {
    const nom = nomInput.value.trim();
    const montant = parseFloat(montantInput.value);

    if (!nom || isNaN(montant)) return alert("Remplis les deux champs !");
    socket.emit("nouvelle_enchere", { nom, montant });
    montantInput.value = "";
  });
}
