// Your Firebase config here:
const firebaseConfig = {
  apiKey: "AIzaSyAXxWcJqSXuI8NBDYm6Qf9qIIiTgNEoGwo",
  authDomain: "anonboard-3fe72.firebaseapp.com",
  databaseURL: "https://anonboard-3fe72-default-rtdb.firebaseio.com",
  projectId: "anonboard-3fe72",
  storageBucket: "anonboard-3fe72.appspot.com",
  messagingSenderId: "801615534660",
  appId: "1:801615534660:web:8ee84ac7c2a96485353a11"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let username = null;
let onlineUsersRef = null;
let userStatusRef = null;
let currentChat = "main"; // 'main' for main chat, or username string for private
const onlineUsersList = document.getElementById("onlineUsersList");
const chatTabs = document.getElementById("chatTabs");
const chatWindow = document.getElementById("chatWindow");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

const usernameModal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const usernameSubmit = document.getElementById("usernameSubmit");
const usernameError = document.getElementById("usernameError");
const appDiv = document.getElementById("app");

let messagesRefs = {}; // To track listeners for private chats

// On load: show username prompt
usernameModal.style.display = "flex";

usernameSubmit.onclick = trySetUsername;
usernameInput.onkeypress = (e) => { if(e.key === "Enter") trySetUsername(); };

async function trySetUsername() {
  const name = usernameInput.value.trim();
  if (!name) {
    usernameError.textContent = "Please enter a username.";
    return;
  }
  if (name.toLowerCase() === "main") {
    usernameError.textContent = "'main' is reserved. Pick another.";
    return;
  }
  // Check uniqueness by seeing if name exists in onlineUsers
  const snapshot = await db.ref("onlineUsers/" + name).get();
  if (snapshot.exists()) {
    usernameError.textContent = "Username taken. Try another.";
    return;
  }
  username = name;
  usernameModal.style.display = "none";
  appDiv.classList.remove("hidden");
  startApp();
}

function startApp() {
  setupPresence();
  listenOnlineUsers();
  setupTabs();
  listenMainChat();
}

// User presence detection
function setupPresence() {
  const userRef = db.ref("onlineUsers/" + username);
  userStatusRef = userRef;
  // On disconnect remove user from onlineUsers
  userRef
    .onDisconnect()
    .remove()
    .then(() => {
      userRef.set(true);
    });
}

// Listen and render online users list (exclude self)
function listenOnlineUsers() {
  onlineUsersRef = db.ref("onlineUsers");
  onlineUsersRef.on("value", (snapshot) => {
    const users = snapshot.val() || {};
    renderOnlineUsers(Object.keys(users).filter((u) => u !== username));
  });
}

function renderOnlineUsers(users) {
  onlineUsersList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    li.title = `Click to open private chat with ${user}`;
    li.onmouseenter = () => {
      li.style.opacity = "0.6";
      li.style.cursor = "pointer";
    };
    li.onmouseleave = () => {
      li.style.opacity = "1";
      li.style.cursor = "default";
    };
    li.onclick = () => openPrivateChat(user);
    onlineUsersList.appendChild(li);
  });
}

// Tabs management
function setupTabs() {
  chatTabs.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab")) {
      const newChat = e.target.getAttribute("data-chat");
      if (newChat !== currentChat) {
        switchChat(newChat);
      }
    }
  });
}

// Open or create a private chat tab
function openPrivateChat(chatUser) {
  if (chatUser === username) return; // can't chat with self
  // Check if tab exists
  if (![...chatTabs.children].some(tab => tab.getAttribute("data-chat") === chatUser)) {
    // Create tab
    const btn = document.createElement("button");
    btn.classList.add("tab");
    btn.textContent = chatUser;
    btn.setAttribute("data-chat", chatUser);
    chatTabs.appendChild(btn);
  }
  switchChat(chatUser);
}

// Switch chat tabs
function switchChat(newChat) {
  // Remove active from all tabs
  [...chatTabs.children].forEach(tab => tab.classList.remove("active"));
  // Add active to selected tab
  const tab = [...chatTabs.children].find(t => t.getAttribute("data-chat") === newChat);
  if (tab) tab.classList.add("active");
  currentChat = newChat;
  // Clear chat window and load messages
  loadChatMessages(newChat);
}

// Listen and render main chat messages
function listenMainChat() {
  const mainChatRef = db.ref("mainChat/messages");
  mainChatRef.on("value", (snapshot) => {
    if (currentChat === "main") {
      renderMessages(snapshot.val());
    }
  });
}

// Load and listen to chat messages for given chat
function loadChatMessages(chatId) {
  chatWindow.innerHTML = "Loading...";
  // Remove old listeners
  Object.values(messagesRefs).forEach(ref => ref.off());
  messagesRefs = {};

  if (chatId === "main") {
    // Listen main chat messages
    const mainChatRef = db.ref("mainChat/messages");
    messagesRefs["main"] = mainChatRef;
    mainChatRef.on("value", (snapshot) => {
      if (currentChat === "main") {
        renderMessages(snapshot.val());
      }
    });
  } else {
    // Private chat between username and chatId
    const chatKey = getPrivateChatKey(username, chatId);
    const privateChatRef = db.ref(`privateChats/${chatKey}/messages`);
    messagesRefs[chatKey] = privateChatRef;
    privateChatRef.on("value", (snapshot) => {
      if (currentChat === chatId) {
        renderMessages(snapshot.val(), true, chatId);
        markMessagesRead(chatKey, chatId);
      }
    });
  }
}

// Format private chat key to be alphabetical to avoid duplication
function getPrivateChatKey(userA, userB) {
  return [userA, userB].sort().join("_");
}

// Render messages in chat window
function renderMessages(messagesObj, isPrivate = false, otherUser = null) {
  chatWindow.innerHTML = "";
  if (!messagesObj) return;
  const messages = Object.values(messagesObj);
  messages.forEach(msg => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(msg.sender === username ? "self" : "other");
    div.textContent = msg.text;

    // Metadata line
    const meta = document.createElement("div");
    meta.classList.add("meta");
    const time = new Date(msg.timestamp);
    meta.textContent = `${msg.sender} • ${time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    div.appendChild(meta);

    // Read receipt (only for self messages in private chats)
    if (isPrivate && msg.sender === username) {
      const receipt = document.createElement("span");
      receipt.classList.add("read-receipt");
      receipt.textContent = msg.readBy && msg.readBy.includes(otherUser) ? "✓" : "";
      div.appendChild(receipt);
    }

    chatWindow.appendChild(div);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Mark messages as read by current user in private chats
function markMessagesRead(chatKey, otherUser) {
  const privateChatRef = db.ref(`privateChats/${chatKey}/messages`);
  privateChatRef.once("value").then(snapshot => {
    const messages = snapshot.val() || {};
    const updates = {};
    Object.entries(messages).forEach(([key, msg]) => {
      if (msg.sender !== username) {
        // Mark readBy array includes username
        if (!msg.readBy || !msg.readBy.includes(username)) {
          updates[key + "/readBy"] = msg.readBy ? [...msg.readBy, username] : [username];
        }
      }
    });
    if (Object.keys(updates).length > 0) {
      privateChatRef.update(updates);
    }
  });
}

// Send message handler
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  const timestamp = Date.now();
  if (currentChat === "main") {
    const newMsgRef = db.ref("mainChat/messages").push();
    newMsgRef.set({
      sender: username,
      text,
      timestamp
    });
  } else {
    const chatKey = getPrivateChatKey(username, currentChat);
    const newMsgRef = db.ref(`privateChats/${chatKey}/messages`).push();
    newMsgRef.set({
      sender: username,
      text,
      timestamp,
      readBy: [username] // sender read by default
    });
  }
  messageInput.value = "";
});
