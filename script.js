// 🔐 PASSWORD (TOP pe hona zaroori)
let MAIN_PASSWORD = "BBA@bgroup2409";

// 📁 FILES LOAD (safe)
function loadFiles() {
  let list = document.getElementById("fileList");
  if (!list) return;

  list.innerHTML = "";

  let files = JSON.parse(localStorage.getItem("files")) || [];

  files.forEach(f => {
    let li = document.createElement("li");
    li.innerText = f.name + " (by " + f.user + ")";
    list.appendChild(li);
  });
}

// 👥 MEMBERS LOAD (safe)
function loadMembers() {
  let list = document.getElementById("membersList");
  if (!list) return;

  list.innerHTML = "";

  let members = JSON.parse(localStorage.getItem("members")) || [];

  members.forEach(m => {
    let li = document.createElement("li");
    li.innerText = m.name;
    list.appendChild(li);
  });
}

// 🚀 AUTO LOAD (safe)
if (document.getElementById("fileList")) {
  loadFiles();
}

if (document.getElementById("membersList")) {
  loadMembers();
}

// 🔑 LOGIN FUNCTION
function login() {
  let name = document.getElementById("name").value;
  let phone = document.getElementById("phone").value;
  let pass = document.getElementById("password").value;

  if (!name || !phone || !pass) {
    alert("Fill all fields");
    return;
  }

  if (pass === MAIN_PASSWORD) {

    localStorage.setItem("currentUser", name);

    let members = JSON.parse(localStorage.getItem("members")) || [];
    members.push({ name, phone });
    localStorage.setItem("members", JSON.stringify(members));

    window.location.href = "index.html";

  } else {
    alert("Wrong Password ❌");
  }
}
