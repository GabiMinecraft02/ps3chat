const pseudoInput = document.getElementById("pseudo");
const loginBtn = document.getElementById("loginBtn");

// récupérer pseudo sauvegardé (lié à l’IP côté serveur)
fetch("/me")
  .then(res => res.json())
  .then(data => {
    if (data.pseudo) {
      pseudoInput.value = data.pseudo;
    }
  });

// valider le pseudo
loginBtn.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (!pseudo) return alert("Pseudo requis");

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pseudo })
  }).then(() => {
    window.location.href = "/";
  });
};
