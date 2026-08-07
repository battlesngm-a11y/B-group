(() => {
  const isLogin = !!document.getElementById("loginForm");
  const isAdmin = !!document.getElementById("adminList");

  const getJSON = (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const saveJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const initials = (name = "User") => name.trim().split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));

  function applyTheme() {
    const dark = localStorage.getItem("darkMode") === "true";
    document.body.classList.toggle("dark", dark);
    document.querySelectorAll(".icon-btn").forEach(btn => {
      const icon = btn.querySelector("i");
      if (icon) icon.className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    });
  }

  function toggleDarkMode() {
    localStorage.setItem("darkMode", localStorage.getItem("darkMode") !== "true");
    applyTheme();
  }

  function showPage(id) {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    const page = document.getElementById(id);
    if (page) page.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === id));
    if (id === "chat") renderChat();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderFiles() {
    const files = getJSON("files");
    const list = document.getElementById("fileList");
    const recent = document.getElementById("recentFiles");
    const count = document.getElementById("fileCount");
    if (count) count.textContent = files.length;

    const card = f => `
      <div class="note-card">
        <span class="file-icon"><i class="fa-solid fa-file-lines"></i></span>
        <div class="note-content">
          <strong>${escapeHTML(f.name)}</strong>
          <small>Shared by ${escapeHTML(f.user || "Unknown")} · ${f.size ? formatBytes(f.size) : "Note"}</small>
        </div>
        ${f.dataUrl ? `<a class="download-btn" href="${f.dataUrl}" download="${escapeHTML(f.name)}" title="Download"><i class="fa-solid fa-download"></i></a>` : ""}
      </div>`;

    const render = (container, items, emptyText) => {
      if (!container) return;
      if (!items.length) {
        container.className = "card-list empty-state";
        container.innerHTML = `<i class="fa-regular fa-folder-open"></i><p>${emptyText}</p>`;
      } else {
        container.className = "card-list";
        container.innerHTML = items.map(card).join("");
      }
    };
    render(list, files.slice().reverse(), "No notes yet. Use + to add a real file.");
    render(recent, files.slice().reverse().slice(0, 3), "No recent notes.");
  }

  function formatBytes(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function addFile(file) {
    if (!file) return;
    const max = 2 * 1024 * 1024;
    if (file.size > max) {
      alert("For this GitHub-only version, please choose a file under 2 MB.");
      return;
    }
    const user = localStorage.getItem("currentUser") || "Unknown";
    const reader = new FileReader();
    reader.onload = () => {
      const files = getJSON("files");
      files.push({
        name: file.name,
        user,
        size: file.size,
        type: file.type,
        dataUrl: reader.result,
        createdAt: Date.now()
      });
      try {
        saveJSON("files", files);
        renderFiles();
        loadAdmin();
      } catch {
        alert("Storage limit reached. Please remove some files or use smaller files.");
      }
    };
    reader.readAsDataURL(file);
  }

  function loadMembers() {
    const members = getJSON("members");
    const list = document.getElementById("membersList");
    const count = document.getElementById("memberCount");
    if (count) count.textContent = members.length;
    if (!list) return;
    if (!members.length) {
      list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i><p>No members found.</p></div>`;
      return;
    }
    list.innerHTML = members.map(m => `
      <div class="member-card">
        <span class="large-avatar">${initials(m.name)}</span>
        <div><strong>${escapeHTML(m.name)}</strong><small>Group member</small></div>
        <span class="status"><i class="fa-solid fa-circle"></i> Active</span>
      </div>`).join("");
  }

  function renderChat() {
    const box = document.getElementById("chatMessages");
    if (!box) return;
    const messages = getJSON("chatMessages");
    const current = localStorage.getItem("currentUser") || "User";
    if (!messages.length) {
      box.innerHTML = `<div class="empty-state"><i class="fa-regular fa-comments"></i><p>No messages yet. Start the conversation.</p></div>`;
      return;
    }
    box.innerHTML = messages.map(m => {
      const mine = m.user === current;
      return `<div class="chat-row ${mine ? "mine" : ""}">
        <span class="chat-avatar">${initials(m.user)}</span>
        <div class="chat-bubble">
          <small>${escapeHTML(m.user)}</small>
          <p>${escapeHTML(m.text)}</p>
          <time>${new Date(m.createdAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</time>
        </div>
      </div>`;
    }).join("");
    box.scrollTop = box.scrollHeight;
  }

  function sendMessage(text) {
    const user = localStorage.getItem("currentUser") || "User";
    const messages = getJSON("chatMessages");
    messages.push({ user, text: text.trim(), createdAt: Date.now() });
    saveJSON("chatMessages", messages.slice(-200));
    renderChat();
  }

  function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  }

  function initLogin() {
    if (localStorage.getItem("currentUser")) {
      window.location.href = "index.html";
      return;
    }
    const form = document.getElementById("loginForm");
    const error = document.getElementById("loginError");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.replace(/\D/g, "");
      const password = document.getElementById("password").value;
      if (name.length < 2) return error.textContent = "Please enter your full name.";
      if (phone.length < 10) return error.textContent = "Please enter a valid phone number.";
      if (password.length < 4) return error.textContent = "Password must contain at least 4 characters.";

      localStorage.setItem("currentUser", name);
      const members = getJSON("members");
      if (!members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
        members.push({ name, phone });
        saveJSON("members", members);
      }
      window.location.href = "index.html";
    });

    document.getElementById("passwordToggle")?.addEventListener("click", () => {
      const input = document.getElementById("password");
      const icon = document.querySelector("#passwordToggle i");
      input.type = input.type === "password" ? "text" : "password";
      icon.className = input.type === "password" ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    });
  }

  function initDashboard() {
    const user = localStorage.getItem("currentUser");
    if (!user) { window.location.href = "login.html"; return; }

    ["username", "profileName", "heroName"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = user;
    });
    ["headerAvatar", "profileAvatar"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = initials(user);
    });

    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document.getElementById("profileLogout")?.addEventListener("click", logout);
    document.getElementById("adminOpen")?.addEventListener("click", () => window.location.href = "admin.html");
    document.getElementById("themeToggle")?.addEventListener("click", toggleDarkMode);
    document.getElementById("filePicker")?.addEventListener("change", e => {
      addFile(e.target.files[0]);
      e.target.value = "";
    });
    document.getElementById("chatForm")?.addEventListener("submit", e => {
      e.preventDefault();
      const input = document.getElementById("chatInput");
      if (input.value.trim()) {
        sendMessage(input.value);
        input.value = "";
        input.focus();
      }
    });
    loadMembers();
    renderFiles();
    renderChat();
  }

  function loadAdmin() {
    const members = getJSON("members");
    const files = getJSON("files");
    const memberCount = document.getElementById("adminMemberCount");
    const fileCount = document.getElementById("adminFileCount");
    if (memberCount) memberCount.textContent = members.length;
    if (fileCount) fileCount.textContent = files.length;

    const list = document.getElementById("adminList");
    if (list) list.innerHTML = members.length
      ? members.map(m => `<div class="admin-row"><span class="large-avatar">${initials(m.name)}</span><div><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.phone || "No phone saved")}</small></div><span class="status"><i class="fa-solid fa-circle"></i> Active</span></div>`).join("")
      : `<div class="empty-state"><i class="fa-solid fa-users"></i><p>No members yet.</p></div>`;

    const fileList = document.getElementById("adminFiles");
    if (fileList) fileList.innerHTML = files.length
      ? files.slice().reverse().map(f => `<div class="note-card"><span class="file-icon"><i class="fa-solid fa-file-lines"></i></span><div class="note-content"><strong>${escapeHTML(f.name)}</strong><small>Shared by ${escapeHTML(f.user || "Unknown")} · ${f.size ? formatBytes(f.size) : "Note"}</small></div>${f.dataUrl ? `<a class="download-btn" href="${f.dataUrl}" download="${escapeHTML(f.name)}"><i class="fa-solid fa-download"></i></a>` : ""}</div>`).join("")
      : `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>No shared notes.</p></div>`;

    const chatList = document.getElementById("adminChat");
    const messages = getJSON("chatMessages");
    if (chatList) chatList.innerHTML = messages.length
      ? messages.slice().reverse().map(m => `<div class="admin-row"><span class="chat-avatar">${initials(m.user)}</span><div><strong>${escapeHTML(m.user)}</strong><small>${escapeHTML(m.text)}</small></div><small>${new Date(m.createdAt).toLocaleString()}</small></div>`).join("")
      : `<div class="empty-state"><i class="fa-regular fa-comments"></i><p>No chat messages.</p></div>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    if (isLogin) initLogin();
    else if (isAdmin) {
      document.getElementById("adminThemeToggle")?.addEventListener("click", toggleDarkMode);
      loadAdmin();
    } else initDashboard();
  });

  window.showPage = showPage;
})();
