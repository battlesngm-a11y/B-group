/* ============================================================
   BBA GROUP - FIREBASE SCRIPT
   Replace your complete script.js with this file.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* ============================================================
   FIREBASE CONFIG
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyD4aCWUNbGwGFgIxr5bXEfCPolbiEbqLjk",
  authDomain: "bba-group.firebaseapp.com",
  projectId: "bba-group",
  storageBucket: "bba-group.firebasestorage.app",
  messagingSenderId: "525637918576",
  appId: "1:525637918576:web:b562987874701888dab9b5",
  measurementId: "G-8M4CF1QRJD"
};


/* ============================================================
   INITIALIZE FIREBASE
   ============================================================ */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


/* ============================================================
   SETTINGS
   ============================================================ */

/*
  IMPORTANT:

  Change this email to YOUR ADMIN EMAIL.

  Example:
  const ADMIN_EMAIL = "battle@gmail.com";
*/

const ADMIN_EMAIL = "YOUR_ADMIN_aag@gmail.com";


/* ============================================================
   GLOBAL VARIABLES
   ============================================================ */

let currentUser = null;
let currentProfile = null;

let unsubscribeMembers = null;
let unsubscribeNotes = null;
let unsubscribeMessages = null;
let unsubscribeGallery = null;


/* ============================================================
   HELPERS
   ============================================================ */

function $(id) {
  return document.getElementById(id);
}


function getCurrentName() {
  return (
    currentProfile?.name ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Student"
  );
}


function initials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .map(x => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}


function formatBytes(bytes) {

  if (!bytes) return "";

  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}


function formatDate(timestamp) {

  if (!timestamp) return "";

  try {

    const date =
      typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleString();

  } catch {

    return "";

  }
}


function isAdmin() {

  if (!currentUser) return false;

  return (
    currentUser.email &&
    currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
}


/* ============================================================
   THEME
   ============================================================ */

function applyTheme() {

  const dark =
    localStorage.getItem("darkMode") === "true";

  document.body.classList.toggle("dark", dark);

  document.querySelectorAll(".icon-btn").forEach(btn => {

    const icon = btn.querySelector("i");

    if (icon) {

      icon.className =
        dark
          ? "fa-solid fa-sun"
          : "fa-solid fa-moon";

    }

  });
}


function toggleDarkMode() {

  const current =
    localStorage.getItem("darkMode") === "true";

  localStorage.setItem(
    "darkMode",
    (!current).toString()
  );

  applyTheme();
}


/* ============================================================
   PAGE NAVIGATION
   ============================================================ */

function showPage(id) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });


  const page = $(id);

  if (page) {
    page.classList.add("active");
  }


  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === id
      );

    });


  if (id === "chat") {
    renderChat();
  }

  if (id === "notes") {
    loadNotes();
  }

  if (id === "members") {
    loadMembers();
  }

  if (id === "gallery") {
    loadGallery();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ============================================================
   FIREBASE AUTH
   ============================================================ */

async function loginUser(email, password) {

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return true;

  } catch (error) {

    console.error(error);

    alert(
      "Login failed: " +
      getFirebaseError(error)
    );

    return false;
  }
}


async function registerUser(
  email,
  password,
  name,
  phone
) {

  try {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = result.user;


    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: email,
        name: name,
        phone: phone || "",
        photoURL: "",
        role:
          email.toLowerCase() ===
          ADMIN_EMAIL.toLowerCase()
            ? "admin"
            : "student",
        status: "active",
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      }
    );


    alert("Registration successful.");

    return true;

  } catch (error) {

    console.error(error);

    alert(
      "Registration failed: " +
      getFirebaseError(error)
    );

    return false;
  }
}


async function resetPassword(email) {

  if (!email) {

    alert("Please enter your email first.");

    return;
  }


  try {

    await sendPasswordResetEmail(
      auth,
      email
    );

    alert(
      "Password reset email sent."
    );

  } catch (error) {

    alert(
      "Reset failed: " +
      getFirebaseError(error)
    );

  }
}


async function logout() {

  try {

    await signOut(auth);

    window.location.href =
      "login.html";

  } catch (error) {

    console.error(error);

  }
}


/* ============================================================
   FIREBASE ERROR TRANSLATION
   ============================================================ */

function getFirebaseError(error) {

  if (!error) {
    return "Unknown error";
  }


  const code = error.code || "";


  const errors = {

    "auth/invalid-email":
      "Invalid email address.",

    "auth/user-not-found":
      "User not found.",

    "auth/wrong-password":
      "Wrong password.",

    "auth/invalid-credential":
      "Email or password is incorrect.",

    "auth/email-already-in-use":
      "This email is already registered.",

    "auth/weak-password":
      "Password must be at least 6 characters.",

    "auth/too-many-requests":
      "Too many attempts. Please try again later.",

    "permission-denied":
      "Firebase permission denied. Check Firestore Rules.",

    "storage/unauthorized":
      "Storage permission denied.",

    "storage/quota-exceeded":
      "Firebase Storage is unavailable on your current plan.",

    "storage/bucket-not-found":
      "Firebase Storage bucket is not available."

  };


  return errors[code] ||
    error.message ||
    "Something went wrong.";
}


/* ============================================================
   LOGIN PAGE
   ============================================================ */

function initLogin() {

  const form = $("loginForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      const name =
        $("name")?.value.trim() || "";

      const phone =
        $("phone")?.value.replace(/\D/g, "") || "";

      const password =
        $("password")?.value || "";


      const error =
        $("loginError");


      /*
        Your old login page contains name + phone + password.

        Firebase Email/Password requires email.

        Therefore the phone is converted to a Firebase-style
        internal email.

        Example:
        9876543210
        becomes
        9876543210@bba-group.local
      */

      let email = "";

      if (
        phone &&
        phone.length >= 10
      ) {

        email =
          phone +
          "@bba-group.local";

      } else if (name.includes("@")) {

        email = name;

      } else {

        if (error) {
          error.textContent =
            "Please enter a valid 10-digit phone number.";
        }

        return;
      }


      if (password.length < 6) {

        if (error) {
          error.textContent =
            "Password must contain at least 6 characters.";
        }

        return;
      }


      const success =
        await loginUser(
          email,
          password
        );


      if (success) {

        localStorage.setItem(
          "currentUser",
          name || email
        );

        window.location.href =
          "index.html";

      }

    }
  );


  $("passwordToggle")?.addEventListener(
    "click",
    () => {

      const input =
        $("password");

      const icon =
        $("passwordToggle")?.querySelector("i");


      if (!input) return;


      input.type =
        input.type === "password"
          ? "text"
          : "password";


      if (icon) {

        icon.className =
          input.type === "password"
            ? "fa-regular fa-eye"
            : "fa-regular fa-eye-slash";

      }

    }
  );


  $("forgotPassword")?.addEventListener(
    "click",
    async e => {

      e.preventDefault();

      const phone =
        $("phone")?.value.replace(/\D/g, "");

      if (!phone) {

        alert(
          "Enter your phone number first."
        );

        return;
      }


      const email =
        phone +
        "@bba-group.local";


      await resetPassword(email);

    }
  );
}


/* ============================================================
   LOAD CURRENT USER PROFILE
   ============================================================ */

async function loadCurrentProfile() {

  if (!currentUser) {
    return null;
  }


  try {

    const snap =
      await getDoc(
        doc(
          db,
          "users",
          currentUser.uid
        )
      );


    if (snap.exists()) {

      currentProfile =
        snap.data();

    } else {

      currentProfile = {

        uid: currentUser.uid,

        email:
          currentUser.email,

        name:
          currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Student",

        phone: "",

        photoURL: "",

        role: isAdmin()
          ? "admin"
          : "student",

        status: "active"

      };


      await setDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        currentProfile
      );

    }


    return currentProfile;

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );

    return null;
  }
}


/* ============================================================
   DASHBOARD INITIALIZATION
   ============================================================ */

async function initDashboard() {

  if (!currentUser) {

    window.location.href =
      "login.html";

    return;
  }


  await loadCurrentProfile();


  const userName =
    getCurrentName();


  [
    "username",
    "profileName",
    "heroName"
  ].forEach(id => {

    const el = $(id);

    if (el) {
      el.textContent = userName;
    }

  });


  [
    "headerAvatar",
    "profileAvatar"
  ].forEach(id => {

    const el = $(id);

    if (el) {
      el.textContent =
        initials(userName);
    }

  });


  $("logoutBtn")?.addEventListener(
    "click",
    logout
  );

  $("profileLogout")?.addEventListener(
    "click",
    logout
  );

  $("themeToggle")?.addEventListener(
    "click",
    toggleDarkMode
  );


  /*
    Admin button
  */

  const adminButton =
    $("adminOpen");

  if (adminButton) {

    if (isAdmin()) {

      adminButton.style.display =
        "";

      adminButton.onclick =
        () => {
          window.location.href =
            "admin.html";
        };

    } else {

      adminButton.style.display =
        "none";

    }

  }


  /*
    File picker
  */

  $("filePicker")?.addEventListener(
    "change",
    async e => {

      const file =
        e.target.files[0];

      if (file) {
        await uploadNote(file);
      }

      e.target.value = "";

    }
  );


  /*
    Chat
  */

  $("chatForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      const input =
        $("chatInput");


      if (!input) return;


      const text =
        input.value.trim();


      if (!text) return;


      await sendMessage(text);


      input.value = "";

      input.focus();

    }
  );


  /*
    Start Firebase listeners
  */

  listenMembers();

  listenNotes();

  listenMessages();

  listenGallery();


  loadMembers();

  loadNotes();

  renderChat();

  loadGallery();

}


/* ============================================================
   MEMBERS
   ============================================================ */

function listenMembers() {

  if (unsubscribeMembers) {
    unsubscribeMembers();
  }


  const q =
    query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );


  unsubscribeMembers =
    onSnapshot(
      q,
      snapshot => {

        const members =
          snapshot.docs.map(
            d => ({
              id: d.id,
              ...d.data()
            })
          );


        renderMembers(
          members
        );

      },
      error => {

        console.error(
          "Members listener:",
          error
        );

      }
    );
}


async function loadMembers() {

  /*
    Firebase realtime listener handles this.
  */

}


/* ============================================================
   RENDER MEMBERS
   ============================================================ */

function renderMembers(members) {

  const list =
    $("membersList");

  const count =
    $("memberCount");


  if (count) {
    count.textContent =
      members.length;
  }


  if (!list) return;


  if (!members.length) {

    list.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-users"></i>
        <p>No members found.</p>
      </div>
    `;

    return;
  }


  list.innerHTML =
    members.map(m => `

      <div class="member-card">

        <span class="large-avatar">
          ${initials(m.name || "User")}
        </span>

        <div>

          <strong>
            ${escapeHTML(
              m.name || "Student"
            )}
          </strong>

          <small>
            ${escapeHTML(
              m.email || ""
            )}
          </small>

        </div>

        <span class="status">

          <i class="fa-solid fa-circle"></i>

          ${
            m.status === "disabled"
              ? "Disabled"
              : "Active"
          }

        </span>

      </div>

    `).join("");

}


/* ============================================================
   NOTES
   ============================================================ */

function listenNotes() {

  if (unsubscribeNotes) {
    unsubscribeNotes();
  }


  const q =
    query(
      collection(db, "notes"),
      orderBy("createdAt", "desc")
    );


  unsubscribeNotes =
    onSnapshot(
      q,
      snapshot => {

        const notes =
          snapshot.docs.map(
            d => ({
              id: d.id,
              ...d.data()
            })
          );


        renderNotes(
          notes
        );

      },
      error => {

        console.error(
          "Notes listener:",
          error
        );

      }
    );
}


async function loadNotes() {

  /*
    Realtime listener handles notes.
  */

}


/* ============================================================
   RENDER NOTES
   ============================================================ */

function renderNotes(notes) {

  const list =
    $("fileList");

  const recent =
    $("recentFiles");

  const count =
    $("fileCount");


  if (count) {
    count.textContent =
      notes.length;
  }


  function noteCard(note) {

    const download =
      note.downloadURL
        ? `
          <a
            class="download-btn"
            href="${note.downloadURL}"
            target="_blank"
            download
            title="Download"
          >
            <i class="fa-solid fa-download"></i>
          </a>
        `
        : "";


    const deleteButton =
      isAdmin()
        ? `
          <button
            class="download-btn"
            onclick="deleteNote('${note.id}','${escapeHTML(note.storagePath || "")}')"
            title="Delete"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        `
        : "";


    return `

      <div class="note-card">

        <span class="file-icon">
          <i class="fa-solid fa-file-lines"></i>
        </span>

        <div class="note-content">

          <strong>
            ${escapeHTML(
              note.name || "Untitled"
            )}
          </strong>

          <small>
            Shared by
            ${escapeHTML(
              note.userName || "Unknown"
            )}

            ·

            ${
              note.size
                ? formatBytes(note.size)
                : "Note"
            }
          </small>

        </div>

        ${download}

        ${deleteButton}

      </div>

    `;

  }


  if (list) {

    if (!notes.length) {

      list.className =
        "card-list empty-state";

      list.innerHTML = `
        <i class="fa-regular fa-folder-open"></i>
        <p>No notes yet.</p>
      `;

    } else {

      list.className =
        "card-list";

      list.innerHTML =
        notes.map(noteCard).join("");

    }

  }


  if (recent) {

    const latest =
      notes.slice(0, 3);


    if (!latest.length) {

      recent.className =
        "card-list empty-state";

      recent.innerHTML = `
        <i class="fa-regular fa-folder-open"></i>
        <p>No recent notes.</p>
      `;

    } else {

      recent.className =
        "card-list";

      recent.innerHTML =
        latest
          .map(noteCard)
          .join("");

    }

  }

}


/* ============================================================
   UPLOAD NOTE
   ============================================================ */

async function uploadNote(file) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;
  }


  /*
    Reasonable limits.
  */

  const maxSize =
    20 * 1024 * 1024;


  if (file.size > maxSize) {

    alert(
      "Maximum file size is 20 MB."
    );

    return;
  }


  try {

    const path =
      `notes/${currentUser.uid}/${Date.now()}_${file.name}`;


    const storageRef =
      ref(
        storage,
        path
      );


    await uploadBytes(
      storageRef,
      file
    );


    const downloadURL =
      await getDownloadURL(
        storageRef
      );


    await addDoc(
      collection(db, "notes"),
      {

        name: file.name,

        type: file.type,

        size: file.size,

        userId:
          currentUser.uid,

        userName:
          getCurrentName(),

        downloadURL:

          downloadURL,

        storagePath:

          path,

        createdAt:
          serverTimestamp()

      }
    );


    alert(
      "Note uploaded successfully."
    );


  } catch (error) {

    console.error(
      "Upload error:",
      error
    );


    alert(
      "Upload failed:\n\n" +
      getFirebaseError(error) +
      "\n\nIf Firebase Storage asks for billing, your project needs Blaze for Storage."
    );

  }

}


/* ============================================================
   DELETE NOTE
   ============================================================ */

async function deleteNote(
  noteId,
  storagePath
) {

  if (!isAdmin()) {

    alert(
      "Admin access required."
    );

    return;
  }


  if (
    !confirm(
      "Delete this note permanently?"
    )
  ) {
    return;
  }


  try {

    /*
      Delete Firestore document
    */

    await deleteDoc(
      doc(
        db,
        "notes",
        noteId
      )
    );


    /*
      Delete actual Storage file
    */

    if (storagePath) {

      try {

        await deleteObject(
          ref(
            storage,
            storagePath
          )
        );

      } catch (storageError) {

        console.warn(
          "Storage delete failed:",
          storageError
        );

      }

    }


    alert(
      "Note deleted."
    );


  } catch (error) {

    console.error(error);

    alert(
      "Delete failed:\n" +
      getFirebaseError(error)
    );

  }

}


/* ============================================================
   CHAT
   ============================================================ */

function listenMessages() {

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }


  const q =
    query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      limit(300)
    );


  unsubscribeMessages =
    onSnapshot(
      q,
      snapshot => {

        const messages =
          snapshot.docs.map(
            d => ({
              id: d.id,
              ...d.data()
            })
          );


        renderChat(
          messages
        );


      },
      error => {

        console.error(
          "Chat listener:",
          error
        );

      }
    );
}


function renderChat(messages = []) {

  const box =
    $("chatMessages");


  if (!box) return;


  if (!messages.length) {

    box.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-comments"></i>
        <p>No messages yet. Start the conversation.</p>
      </div>
    `;

    return;
  }


  const currentUid =
    currentUser?.uid;


  box.innerHTML =
    messages.map(m => {

      const mine =
        m.userId === currentUid;


      const deleteButton =
        isAdmin() || mine
          ? `
            <button
              class="chat-delete"
              onclick="deleteMessage('${m.id}')"
              title="Delete message"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          `
          : "";


      return `

        <div
          class="chat-row ${mine ? "mine" : ""}"
        >

          <span class="chat-avatar">

            ${initials(
              m.userName || "User"
            )}

          </span>

          <div class="chat-bubble">

            <small>
              ${escapeHTML(
                m.userName || "User"
              )}
            </small>

            <p>
              ${escapeHTML(
                m.text || ""
              )}
            </p>

            <time>
              ${formatDate(
                m.createdAt
              )}
            </time>

            ${deleteButton}

          </div>

        </div>

      `;

    }).join("");


  box.scrollTop =
    box.scrollHeight;
}


async function sendMessage(text) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;
  }


  const clean =
    text.trim();


  if (!clean) {
    return;
  }


  if (clean.length > 1000) {

    alert(
      "Message is too long."
    );

    return;
  }


  try {

    await addDoc(
      collection(db, "messages"),
      {

        userId:
          currentUser.uid,

        userName:
          getCurrentName(),

        text:
          clean,

        createdAt:
          serverTimestamp()

      }
    );

  } catch (error) {

    console.error(error);

    alert(
      "Message failed:\n" +
      getFirebaseError(error)
    );

  }

}


/* ============================================================
   DELETE MESSAGE
   ============================================================ */

async function deleteMessage(
  messageId
) {

  if (!currentUser) {
    return;
  }


  try {

    const messageRef =
      doc(
        db,
        "messages",
        messageId
      );


    const messageSnap =
      await getDoc(
        messageRef
      );


    if (!messageSnap.exists()) {
      return;
    }


    const message =
      messageSnap.data();


    const allowed =
      isAdmin() ||
      message.userId ===
        currentUser.uid;


    if (!allowed) {

      alert(
        "You cannot delete this message."
      );

      return;
    }


    if (
      !confirm(
        "Delete this message?"
      )
    ) {
      return;
    }


    await deleteDoc(
      messageRef
    );


  } catch (error) {

    console.error(error);

    alert(
      "Delete failed:\n" +
      getFirebaseError(error)
    );

  }

}


/* ============================================================
   GALLERY
   ============================================================ */

function listenGallery() {

  if (unsubscribeGallery) {
    unsubscribeGallery();
  }


  const q =
    query(
      collection(db, "gallery"),
      orderBy("createdAt", "desc")
    );


  unsubscribeGallery =
    onSnapshot(
      q,
      snapshot => {

        const media =
          snapshot.docs.map(
            d => ({
              id: d.id,
              ...d.data()
            })
          );


        renderGallery(
          media
        );

      },
      error => {

        console.error(
          "Gallery listener:",
          error
        );

      }
    );
}


function loadGallery() {
  /*
    Realtime listener handles gallery.
  */
}


function renderGallery(media) {

  const gallery =
    $("galleryList") ||
    $("gallery");


  const count =
    $("galleryCount");


  if (count) {
    count.textContent =
      media.length;
  }


  if (!gallery) return;


  if (!media.length) {

    gallery.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-images"></i>
        <p>No photos or videos yet.</p>
      </div>
    `;

    return;
  }


  gallery.innerHTML =
    media.map(item => {

      const deleteButton =
        isAdmin()
          ? `
            <button
              onclick="deleteGalleryItem('${item.id}','${escapeHTML(item.storagePath || "")}')"
              class="download-btn"
              title="Delete"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          `
          : "";


      let content = "";


      if (
        item.type &&
        item.type.startsWith("video/")
      ) {

        content = `
          <video
            controls
            preload="metadata"
            style="width:100%;max-width:500px;border-radius:12px;"
          >
            <source
              src="${item.downloadURL}"
              type="${item.type}"
            >
          </video>
        `;

      } else {

        content = `
          <img
            src="${item.downloadURL}"
            alt="${escapeHTML(item.name || "Photo")}"
            loading="lazy"
            style="width:100%;max-width:500px;border-radius:12px;"
          >
        `;

      }


      return `

        <div class="gallery-card">

          ${content}

          <div class="gallery-info">

            <strong>
              ${escapeHTML(
                item.name || "Media"
              )}
            </strong>

            <small>
              Uploaded by
              ${escapeHTML(
                item.userName || "Student"
              )}
            </small>

            <div>

              <a
                href="${item.downloadURL}"
                target="_blank"
                class="download-btn"
              >
                <i class="fa-solid fa-up-right-from-square"></i>
              </a>

              ${deleteButton}

            </div>

          </div>

        </div>

      `;

    }).join("");

}


/* ============================================================
   UPLOAD PHOTO / VIDEO
   ============================================================ */

async function uploadGalleryMedia(
  file
) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;
  }


  if (
    !file.type.startsWith("image/") &&
    !file.type.startsWith("video/")
  ) {

    alert(
      "Only images and videos are allowed."
    );

    return;
  }


  /*
    50 MB max for browser upload.
  */

  const maxSize =
    50 * 1024 * 1024;


  if (file.size > maxSize) {

    alert(
      "Maximum media size is 50 MB."
    );

    return;
  }


  try {

    const path =
      `gallery/${currentUser.uid}/${Date.now()}_${file.name}`;


    const storageRef =
      ref(
        storage,
        path
      );


    await uploadBytes(
      storageRef,
      file
    );


    const downloadURL =
      await getDownloadURL(
        storageRef
      );


    await addDoc(
      collection(db, "gallery"),
      {

        name:
          file.name,

        type:
          file.type,

        size:
          file.size,

        userId:
          currentUser.uid,

        userName:
          getCurrentName(),

        downloadURL:
          downloadURL,

        storagePath:
          path,

        createdAt:
          serverTimestamp()

      }
    );


    alert(
      "Media uploaded successfully."
    );


  } catch (error) {

    console.error(
      "Gallery upload:",
      error
    );


    alert(
      "Gallery upload failed:\n\n" +
      getFirebaseError(error) +
      "\n\nFirebase Storage requires the Blaze plan."
    );

  }

}


/* ============================================================
   DELETE GALLERY ITEM
   ============================================================ */

async function deleteGalleryItem(
  itemId,
  storagePath
) {

  if (!isAdmin()) {

    alert(
      "Admin access required."
    );

    return;
  }


  if (
    !confirm(
      "Delete this photo/video permanently?"
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "gallery",
        itemId
      )
    );


    if (storagePath) {

      try {

        await deleteObject(
          ref(
            storage,
            storagePath
          )
        );

      } catch (error) {

        console.warn(
          "Storage file delete:",
          error
        );

      }

    }


    alert(
      "Media deleted."
    );


  } catch (error) {

    console.error(error);

    alert(
      "Delete failed:\n" +
      getFirebaseError(error)
    );

  }

}


/* ============================================================
   ADMIN PANEL
   ============================================================ */

async function loadAdmin() {

  if (!isAdmin()) {

    alert(
      "Admin access denied."
    );

    window.location.href =
      "index.html";

    return;
  }


  /*
    Admin stats/listeners
  */

  listenAdminUsers();

  listenAdminNotes();

  listenAdminMessages();

  listenAdminGallery();

}


function listenAdminUsers() {

  const q =
    query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );


  onSnapshot(
    q,
    snapshot => {

      const users =
        snapshot.docs.map(
          d => ({
            id: d.id,
            ...d.data()
          })
        );


      const count =
        $("adminMemberCount");


      if (count) {
        count.textContent =
          users.length;
      }


      const list =
        $("adminList");


      if (!list) return;


      if (!users.length) {

        list.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-users"></i>
            <p>No students yet.</p>
          </div>
        `;

        return;
      }


      list.innerHTML =
        users.map(user => `

          <div class="admin-row">

            <span class="large-avatar">
              ${initials(
                user.name || "User"
              )}
            </span>

            <div>

              <strong>
                ${escapeHTML(
                  user.name || "Student"
                )}
              </strong>

              <small>
                ${escapeHTML(
                  user.email || ""
                )}
              </small>

            </div>

            <span class="status">

              <i class="fa-solid fa-circle"></i>

              ${
                user.status === "disabled"
                  ? "Disabled"
                  : "Active"
              }

            </span>

          </div>

        `).join("");

    }
  );

}


function listenAdminNotes() {

  const q =
    query(
      collection(db, "notes"),
      orderBy("createdAt", "desc")
    );


  onSnapshot(
    q,
    snapshot => {

      const notes =
        snapshot.docs.map(
          d => ({
            id: d.id,
            ...d.data()
          })
        );


      const count =
        $("adminFileCount");


      if (count) {
        count.textContent =
          notes.length;
      }


      const list =
        $("adminFiles");


      if (!list) return;


      if (!notes.length) {

        list.innerHTML = `
          <div class="empty-state">
            <i class="fa-regular fa-folder-open"></i>
            <p>No shared notes.</p>
          </div>
        `;

        return;
      }


      list.innerHTML =
        notes.map(note => `

          <div class="note-card">

            <span class="file-icon">
              <i class="fa-solid fa-file-lines"></i>
            </span>

            <div class="note-content">

              <strong>
                ${escapeHTML(
                  note.name || "Note"
                )}
              </strong>

              <small>

                Shared by
                ${escapeHTML(
                  note.userName || "Unknown"
                )}

                ·

                ${
                  note.size
                    ? formatBytes(
                        note.size
                      )
                    : ""
                }

              </small>

            </div>

            ${
              note.downloadURL
                ? `
                  <a
                    class="download-btn"
                    href="${note.downloadURL}"
                    target="_blank"
                    download
                  >
                    <i class="fa-solid fa-download"></i>
                  </a>
                `
                : ""
            }

            <button
              class="download-btn"
              onclick="deleteNote('${note.id}','${escapeHTML(note.storagePath || "")}')"
              title="Delete permanently"
            >
              <i class="fa-solid fa-trash"></i>
            </button>

          </div>

        `).join("");

    }
  );

}


function listenAdminMessages() {

  const q =
    query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(300)
    );


  onSnapshot(
    q,
    snapshot => {

      const messages =
        snapshot.docs.map(
          d => ({
            id: d.id,
            ...d.data()
          })
        );


      const count =
        $("adminMessageCount");


      if (count) {
        count.textContent =
          messages.length;
      }


      const list =
        $("adminChat");


      if (!list) return;


      if (!messages.length) {

        list.innerHTML = `
          <div class="empty-state">
            <i class="fa-regular fa-comments"></i>
            <p>No chat messages.</p>
          </div>
        `;

        return;
      }


      list.innerHTML =
        messages.map(m => `

          <div class="admin-row">

            <span class="chat-avatar">
              ${initials(
                m.userName || "User"
              )}
            </span>

            <div>

              <strong>
                ${escapeHTML(
                  m.userName || "User"
                )}
              </strong>

              <small>
                ${escapeHTML(
                  m.text || ""
                )}
              </small>

            </div>

            <button
              class="download-btn"
              onclick="deleteMessage('${m.id}')"
              title="Delete"
            >
              <i class="fa-solid fa-trash"></i>
            </button>

          </div>

        `).join("");

    }
  );

}


function listenAdminGallery() {

  const q =
    query(
      collection(db, "gallery"),
      orderBy("createdAt", "desc")
    );


  onSnapshot(
    q,
    snapshot => {

      const media =
        snapshot.docs.map(
          d => ({
            id: d.id,
            ...d.data()
          })
        );


      const photoCount =
        $("adminPhotoCount");

      const videoCount =
        $("adminVideoCount");


      if (photoCount) {

        photoCount.textContent =
          media.filter(
            m =>
              m.type?.startsWith(
                "image/"
              )
          ).length;

      }


      if (videoCount) {

        videoCount.textContent =
          media.filter(
            m =>
              m.type?.startsWith(
                "video/"
              )
          ).length;

      }


      const list =
        $("adminGallery");


      if (!list) return;


      if (!media.length) {

        list.innerHTML = `
          <div class="empty-state">
            <i class="fa-regular fa-images"></i>
            <p>No gallery media.</p>
          </div>
        `;

        return;
      }


      list.innerHTML =
        media.map(item => `

          <div class="admin-gallery-row">

            ${
              item.type?.startsWith("video/")
                ? `
                  <video
                    src="${item.downloadURL}"
                    controls
                    style="width:160px;border-radius:10px;"
                  ></video>
                `
                : `
                  <img
                    src="${item.downloadURL}"
                    style="width:160px;border-radius:10px;"
                    alt=""
                  >
                `
            }

            <div>

              <strong>
                ${escapeHTML(
                  item.name || "Media"
                )}
              </strong>

              <small>
                Uploaded by
                ${escapeHTML(
                  item.userName || "Student"
                )}
              </small>

            </div>

            <button
              class="download-btn"
              onclick="deleteGalleryItem('${item.id}','${escapeHTML(item.storagePath || "")}')"
            >
              <i class="fa-solid fa-trash"></i>
            </button>

          </div>

        `).join("");

    }
  );

}


/* ============================================================
   ADMIN STUDENT ACTIONS
   ============================================================ */

async function disableStudent(
  uid
) {

  if (!isAdmin()) {
    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "users",
        uid
      ),
      {
        status: "disabled"
      }
    );


    alert(
      "Student disabled."
    );

  } catch (error) {

    alert(
      getFirebaseError(error)
    );

  }

}


async function enableStudent(
  uid
) {

  if (!isAdmin()) {
    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "users",
        uid
      ),
      {
        status: "active"
      }
    );


    alert(
      "Student enabled."
    );

  } catch (error) {

    alert(
      getFirebaseError(error)
    );

  }

}


/* ============================================================
   PROFILE PHOTO
   ============================================================ */

async function uploadProfilePhoto(
  file
) {

  if (!currentUser) {
    return;
  }


  if (!file.type.startsWith("image/")) {

    alert(
      "Please select an image."
    );

    return;
  }


  const maxSize =
    5 * 1024 * 1024;


  if (file.size > maxSize) {

    alert(
      "Maximum profile photo size is 5 MB."
    );

    return;
  }


  try {

    const path =
      `profiles/${currentUser.uid}/profile.jpg`;


    const storageRef =
      ref(
        storage,
        path
      );


    await uploadBytes(
      storageRef,
      file
    );


    const url =
      await getDownloadURL(
        storageRef
      );


    await updateDoc(
      doc(
        db,
        "users",
        currentUser.uid
      ),
      {
        photoURL: url
      }
    );


    currentProfile.photoURL =
      url;


    const avatar =
      $("profileAvatar");


    if (avatar) {

      avatar.innerHTML = `
        <img
          src="${url}"
          alt="Profile"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            border-radius:50%;
          "
        >
      `;

    }


    alert(
      "Profile photo updated."
    );


  } catch (error) {

    console.error(error);

    alert(
      "Profile photo upload failed:\n" +
      getFirebaseError(error)
    );

  }

}


/* ============================================================
   ANNOUNCEMENTS
   ============================================================ */

async function createAnnouncement(
  title,
  message
) {

  if (!isAdmin()) {

    alert(
      "Admin access required."
    );

    return;
  }


  if (!title || !message) {

    alert(
      "Enter title and message."
    );

    return;
  }


  try {

    await addDoc(
      collection(
        db,
        "announcements"
      ),
      {

        title:
          title.trim(),

        message:
          message.trim(),

        createdBy:
          currentUser.uid,

        createdAt:
          serverTimestamp()

      }
    );


    alert(
      "Announcement created."
    );


  } catch (error) {

    alert(
      "Failed:\n" +
      getFirebaseError(error)
    );

  }

}


async function deleteAnnouncement(
  id
) {

  if (!isAdmin()) {
    return;
  }


  if (
    !confirm(
      "Delete announcement?"
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "announcements",
        id
      )
    );

  } catch (error) {

    alert(
      getFirebaseError(error)
    );

  }

}


/* ============================================================
   GLOBAL FUNCTIONS
   HTML onclick="" SE USE KARNE KE LIYE
   ============================================================ */

window.showPage =
  showPage;

window.toggleDarkMode =
  toggleDarkMode;

window.logout =
  logout;

window.uploadNote =
  uploadNote;

window.deleteNote =
  deleteNote;

window.sendMessage =
  sendMessage;

window.deleteMessage =
  deleteMessage;

window.uploadGalleryMedia =
  uploadGalleryMedia;

window.deleteGalleryItem =
  deleteGalleryItem;

window.disableStudent =
  disableStudent;

window.enableStudent =
  enableStudent;

window.uploadProfilePhoto =
  uploadProfilePhoto;

window.createAnnouncement =
  createAnnouncement;

window.deleteAnnouncement =
  deleteAnnouncement;

window.loginUser =
  loginUser;

window.registerUser =
  registerUser;

window.resetPassword =
  resetPassword;


/* ============================================================
   FILE PICKER HELPER
   ============================================================ */

window.openNotePicker =
  function () {

    const picker =
      $("filePicker");

    if (picker) {
      picker.click();
    }

  };


window.openGalleryPicker =
  function () {

    const picker =
      $("galleryPicker");

    if (picker) {
      picker.click();
    }

  };


/* ============================================================
   DOM CONTENT LOADED
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    applyTheme();


    /*
      LOGIN PAGE
    */

    if ($("loginForm")) {

      initLogin();

      return;
    }


    /*
      ADMIN PAGE
    */

    if ($("adminList")) {

      onAuthStateChanged(
        auth,
        async user => {

          if (!user) {

            window.location.href =
              "login.html";

            return;
          }


          currentUser =
            user;


          await loadCurrentProfile();


          if (!isAdmin()) {

            alert(
              "You are not an admin."
            );

            window.location.href =
              "index.html";

            return;
          }


          $("adminThemeToggle")
            ?.addEventListener(
              "click",
              toggleDarkMode
            );


          await loadAdmin();

        }
      );


      return;
    }


    /*
      STUDENT DASHBOARD
    */

    onAuthStateChanged(
      auth,
      async user => {

        if (!user) {

          window.location.href =
            "login.html";

          return;
        }


        currentUser =
          user;


        await initDashboard();

      }
    );

  }
);


/* ============================================================
   CLEANUP
   ============================================================ */

window.addEventListener(
  "beforeunload",
  () => {

    if (unsubscribeMembers) {
      unsubscribeMembers();
    }

    if (unsubscribeNotes) {
      unsubscribeNotes();
    }

    if (unsubscribeMessages) {
      unsubscribeMessages();
    }

    if (unsubscribeGallery) {
      unsubscribeGallery();
    }

  }
);
