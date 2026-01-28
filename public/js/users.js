const usersList = document.getElementById("users");

socket.on("users", list => {
  usersList.innerHTML = "";

  list.forEach(u => {
    const li = document.createElement("li");
    li.className = "user";

    const name = document.createElement("span");
    name.textContent = u.pseudo;

    const status = document.createElement("span");
    status.className = "status";

    // 🔈 présent / 🔊 parle / 🔇 mute
    if (u.isMuted) status.textContent = " 🔇";
    else if (u.inVoice) status.textContent = " 🔊";
    else status.textContent = " 🔈";

    li.appendChild(name);
    li.appendChild(status);
    usersList.appendChild(li);
  });
});
