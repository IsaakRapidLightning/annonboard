// == AnonBoard Messaging app ==

// DUMMY data for demo
const users = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'];

// Chats structure
// Key = username, value = array of messages
// message = { from: 'self' | 'other', text: string, time: string, read: boolean }
let chats = {
  'Alice': [
    {from: 'self', text: 'Hey Alice! How are you?', time: '10:00 AM', read: true},
    {from: 'other', text: 'Hi! I am good, thanks!', time: '10:02 AM', read: true},
  ],
  'Bob': [
    {from: 'other', text: 'Hey, ready for the game tonight?', time: '9:30 AM', read: false},
  ],
  'Charlie': [],
  'Dave': [
    {from: 'self', text: 'Hello Dave!', time: 'Yesterday', read: true},
  ],
  'Eve': []
};

// DOM references
const onlineUsersList = document.getElementById('onlineUsers');
const chatList = document.getElementById('chatList');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatWindow = document.getElementById('chatWindow');
const messagesDiv = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

let currentChatUser = null; // Who is the current chat open with

// Populate ONLINE users list
function populateOnlineUsers() {
  onlineUsersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    li.title = `Start chat with ${user}`;
    li.onclick = () => openChat(user);
    if (user === currentChatUser) {
      li.classList.add('active');
    }
    onlineUsersList.appendChild(li);
  });
}

// Populate CHATS list - only show users with chats
function populateChatList() {
  chatList.innerHTML = '';
  Object.keys(chats).forEach(user => {
    if (chats[user] && chats[user].length > 0) {
      const li = document.createElement('li');
      li.textContent = user;
      li.title = `Open chat with ${user}`;
      li.onclick = () => openChat(user);
      if (user === currentChatUser) {
        li.classList.add('active');
      }
      chatList.appendChild(li);
    }
  });
}

// Open chat with a user
function openChat(user) {
  currentChatUser = user;
  welcomeScreen.classList.add('hidden');
  chatWindow.classList.remove('hidden');
  renderMessages(user);
  populateOnlineUsers();
  populateChatList();
  messageInput.focus();
}

// Render chat messages for a user
function renderMessages(user) {
  messagesDiv.innerHTML = '';
  const userChats = chats[user] || [];
  userChats.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(msg.from === 'self' ? 'self' : 'other');
    msgDiv.textContent = msg.text;

    // Timestamp line
    const metaDiv = document.createElement('div');
    metaDiv.classList.add('meta');
    metaDiv.textContent = msg.time;

    // Read receipt for self messages if read
    if (msg.from === 'self' && msg.read) {
      const readSpan = document.createElement('span');
      readSpan.classList.add('read-receipt');
      readSpan.textContent = ' ✓✓';
      metaDiv.appendChild(readSpan);
    }

    msgDiv.appendChild(metaDiv);
    messagesDiv.appendChild(msgDiv);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Utility: get formatted current time (like 1:05 PM)
function getCurrentTime() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // hour '0' should be 12
  const mStr = m < 10 ? '0'+m : m;
  return `${h}:${mStr} ${ampm}`;
}

// Send message handler
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if(!text || !currentChatUser) return;

  const timeStr = getCurrentTime();

  // Add message to chat history
  if(!chats[currentChatUser]) chats[currentChatUser] = [];
  chats[currentChatUser].push({from: 'self', text, time: timeStr, read: false});

  // Update UI
  renderMessages(currentChatUser);
  populateChatList();

  // Clear input
  messageInput.value = '';

  // Simulate auto-reply after 1.2 seconds (for demo)
  setTimeout(() => {
    chats[currentChatUser].push({
      from: 'other',
      text: "Auto-reply: Got your message!",
      time: getCurrentTime(),
      read: true
    });
    renderMessages(currentChatUser);
    populateChatList();

    // Mark self messages as read after reply (simulate)
    chats[currentChatUser].forEach(msg => {
      if(msg.from === 'self') msg.read = true;
    });
  }, 1200);
});

// Initialize UI
populateOnlineUsers();
populateChatList();
