// USER
let user = localStorage.getItem("currentUser");
document.getElementById("username").innerText = user;
document.getElementById("profileName").innerText = user;

// PAGE SWITCH
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// NOTES
function uploadFile() {
  let name = prompt("Enter file name");
  if (!name) return;

  let files = JSON.parse(localStorage.getItem("files")) || [];
  files.push({name, user});
  localStorage.setItem("files", JSON.stringify(files));
  loadFiles();
}

function loadFiles() {
  let list = document.getElementById("fileList");
  list.innerHTML = "";
  let files = JSON.parse(localStorage.getItem("files")) || [];

  files.forEach(f => {
    let li = document.createElement("li");
    li.innerText = f.name + " (by " + f.user + ")";
    list.appendChild(li);
  });
}

loadFiles();

// MEMBERS
function loadMembers() {
  let list = document.getElementById("membersList");
  list.innerHTML = "";

  let members = JSON.parse(localStorage.getItem("members")) || [];
  members.forEach(m => {
    let li = document.createElement("li");
    li.innerText = m.name;
    list.appendChild(li);
  });
}
loadMembers();