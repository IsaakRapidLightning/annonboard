// Firebase import (using CDN for simplicity)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAXxWcJqSXuI8NBDYm6Qf9qIIiTgNEoGwo",
  authDomain: "anonboard-3fe72.firebaseapp.com",
  databaseURL: "https://anonboard-3fe72-default-rtdb.firebaseio.com/",
  projectId: "anonboard-3fe72",
  storageBucket: "anonboard-3fe72.firebasestorage.app",
  messagingSenderId: "801615534660",
  appId: "1:801615534660:web:8ee84ac7c2a96485353a11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const messagesRef = ref(database, "messages");

// DOM elements
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages-container");

// Submit message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text !== "") {
    push(messagesRef, {
      text: text,
      timestamp: Date.now()
    });
    input.value = "";
  }
});

// Display new messages
onChildAdded(messagesRef, (snapshot) => {
  const message = snapshot.val();
  const div = document.createElement("div");
  div.classList.add("message");
  div.textContent = message.text;
  messagesContainer.prepend(div); // newest on top
});
