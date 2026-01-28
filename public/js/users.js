// users.js
const usersList = document.getElementById("usersList");

socket.on("users", users => {
  if (!usersList) return;
  usersList.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = `${u.pseudo} (${u.ip})`;
    usersList.appendChild(li);
  });
});
