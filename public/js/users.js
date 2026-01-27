const usersUl = document.getElementById("users");

socket.on("users", list => {
  usersUl.innerHTML = "";

  list.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.pseudo + " ";

    const icon = document.createElement("span");

    if (u.isMuted) icon.textContent = "🔇";
    else if (u.inVoice) icon.textContent = "🔊";
    else icon.textContent = "🔈";

    li.appendChild(icon);
    usersUl.appendChild(li);
  });
});
