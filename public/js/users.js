const socket = io();
const usersList = document.getElementById("users-list");

socket.on("users", list => {
  usersList.innerHTML = "";
  list.forEach(u => {
    const div = document.createElement("div");
    div.textContent = u.pseudo;
    usersList.appendChild(div);
  });
});
