const roomname = localStorage.getItem("roomname");
const username = localStorage.getItem("username");
const uid = localStorage.getItem('uid');
const rid = localStorage.getItem("rid");
const input = document.querySelector("#chat-input");
const form = input.closest("form");
const chatContainer = document.querySelector("#chat-box");
const changeRoom = document.querySelector("#change_room");
const leaveRoom = document.querySelector("#leave_room");
const signOutRoom = document.querySelector("#signOut");
const title = document.querySelector("h2");
const typing = document.querySelector("#typing");
const navBar = document.querySelector("nav");
const inputBar = document.querySelector("#input-bar");
title.textContent = roomname;

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQptlUxQU9-mph61V6RXiFqVBxFQMzImU",
  authDomain: "chat-app-275c4.firebaseapp.com",
  projectId: "chat-app-275c4",
  storageBucket: "chat-app-275c4.firebasestorage.app",
  messagingSenderId: "1021810476046",
  appId: "1:1021810476046:web:c821768c5eeb1ed1e0685f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let inputHeight = 0;
let msgBoxOrignalHeight = 0;

window.onload = () => {
  inputHeight = input.scrollHeight;
  const navHeight = navBar.offsetHeight;
  const inputBarHeight = inputBar.offsetHeight;

  const inputBarPadding = parseFloat(
    window.getComputedStyle(document.querySelector("#input-bar")).paddingTop
  );
  const totalHeight = window.innerHeight;
  const remainingHeight = totalHeight - inputBarHeight - inputBarPadding * 2;

  chatContainer.style.marginTop = navHeight + "px";
  chatContainer.style.height = remainingHeight + "px";
  msgBoxOrignalHeight = remainingHeight;

  document.querySelector("#offcanvasWithBothOptionsLabel").textContent =
    username;
  document.querySelector("form textarea").focus();
};

const socket = io("https://bbb-chat-service.onrender.com", {
  transports: ['websocket'],
  auth : {
    rid : rid,
    uid : uid,
    username: username,
    newJoin: localStorage.getItem('newJoin')
  }
});

let leaveOrChange = 0;

input.addEventListener("input", function () {
  this.style.height = "auto";
  const lineHeight = parseFloat(getComputedStyle(this).lineHeight);
  const maxHeight = lineHeight * 5;

  const newHeight = Math.min(this.scrollHeight, maxHeight);

  if (newHeight !== inputHeight) {
    const diff = newHeight - inputHeight;
    const currentHeight = parseFloat(chatContainer.style.height);
    chatContainer.style.height = currentHeight - diff + "px";
    inputHeight = newHeight;
  }

  this.style.height = newHeight + "px";
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // Prevent newline
    form.requestSubmit(); // Submit form
  }
});

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const message = input.value;

  if (message.trim() != "") {
    socket.emit("message", {
      text: message,
      uid: uid,
      rid: rid,
      sender: username
    });
    input.value = "";

    socket.emit("stop_typing", {
      uid: uid,
      rid: rid,
    });
    input.style.height = "auto";
    inputHeight = input.scrollHeight;
    chatContainer.style.height = msgBoxOrignalHeight + "px";
  }
});

window.addEventListener("beforeunload", function () {
  if(leaveOrChange==0){
  socket.emit('changeRoom', {
    rid: rid,
    uid: uid,
    username: username
  });
  }
  localStorage.removeItem("rid");
  localStorage.removeItem("roomname");
  window.location.href = '/room';
});

leaveRoom.addEventListener("click", (e) => {
  leaveOrChange = 1;
  e.preventDefault();
  socket.emit('leaveRoom', {
    rid: rid,
    uid: uid,
    username: username
  });
  localStorage.removeItem('rid');
  localStorage.removeItem('roomname');
  window.location.href = "/room";
});

changeRoom.addEventListener("click", (e) => {
  leaveOrChange = 1;
  e.preventDefault();
  socket.emit('changeRoom', {
    rid: rid,
    uid: uid,
    username: username
  });
  localStorage.removeItem('rid');
  localStorage.removeItem('roomname');
  window.location.href = "/room";
});

signOutRoom.addEventListener("click", (e) => {
  signOut(auth)
    .then(() => {
      localStorage.clear();
      window.location.href = "/";
    })
    .catch((error) => {
      alert("Error signing out: " + error.message);
    });
});

let typingTimeout;

input.addEventListener("input", (e) => {
  clearTimeout(typingTimeout);

  if (input.value.length > 0) {
    socket.emit("typing", {
      uid: uid,
      rid: rid,
    });

    typingTimeout = setTimeout(() => {
      socket.emit("stop_typing", {
        uid: uid,
        rid: rid,
      });
    }, 5000);
  } else {
    socket.emit("stop_typing", {
      uid: uid,
      rid: rid,
    });
  }
});

function statusHandler(uid, msg) {
  const status = document.createElement("div");
  status.textContent = uid + " " + msg;
  status.style.width = "max-content";
  status.style.maxWidth = "75%";
  status.style.borderRadius = "12px";
  status.className = "d-block m-2 p-2 text-wrap text-break";
  status.classList.add("mx-auto");
  status.style.backgroundColor = "black";
  status.style.color = "white";
  chatContainer.appendChild(status);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('read')) {
          const messageId = entry.target.dataset.mid;
          socket.emit('msgRead', {
            "uid": uid,
            "rid": rid,
            "mid" : messageId
          }); 
          entry.target.classList.add('read');
          observer.unobserve(entry.target);
      }
  });
}, {
  threshold: 0.5
});

function markAsRead(messageId) {
  const msgElement = document.querySelector(`[data-mid="${messageId}"]`);
  if (!msgElement) {
    console.warn(`⚠️ markAsRead: No message found for MID: ${messageId}`);
    return;
  }

  const statusDiv = msgElement.querySelector('div');
  if (!statusDiv) {
    console.warn(`⚠️ markAsRead: No status <div> found inside message ${messageId}`);
    return;
  }

  const statusImg = statusDiv.querySelector('img');
  if (!statusImg) {
    console.warn(`⚠️ markAsRead: No <img> found in status div of message ${messageId}`);
    return;
  }

  // Animate change to read status
  statusImg.style.opacity = 0;
  setTimeout(() => {
    statusImg.src = '../static/read.svg';
    statusImg.style.opacity = 1;
  }, 300);
}


function msgMaker(data) {
  const isMe = data.uid === uid;
  const msgBox = document.createElement("div");
  const user = document.createElement("h6");
  const msg = document.createElement("p");
  const status = document.createElement("div");
  const time = document.createElement("span");

  msgBox.dataset.mid = data.mid;
  status.appendChild(time);

  //Status Mark
  if(isMe) {
    const mark = document.createElement("img");
    
    if(data.readByAll)  mark.src = '../static/read.svg';
    else mark.src = '../static/sent.svg';
    mark.width = '16';
    mark.height = '16';
    mark.alt = 'sent';
    mark.style.marginLeft = '1px';
    mark.classList = 'status-mark';
    status.appendChild(mark);
  } 
  status.className = "d-flex justify-content-end align-items-center";
  status.style.fontSize = "75%";
  status.style.color = "grey";

  if (data.readByAll || data.read_by_users.includes(uid)) {
    msgBox.classList.add('read');
  } else {
    observer.observe(msgBox);
  }

  const dateTime = new Date(data.time);
  const localDateTime = dateTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase();

  if(isMe) user.textContent = 'Me';
  else user.textContent = data.sender;
  msg.textContent = data.text;
  time.textContent = localDateTime;

  msgBox.appendChild(user);
  msgBox.appendChild(msg);
  msgBox.appendChild(status);

  msgBox.style.height = "max-content";
  msgBox.style.width = "max-content";
  msgBox.style.maxWidth = "75%";
  msgBox.style.borderRadius = "12px";
  msgBox.className = "position-relative d-block m-2 p-2 text-wrap text-break";

  if (isMe) {
    msgBox.classList.add("ms-auto");
    msgBox.style.backgroundColor = "lightgreen";
  } else {
    msgBox.style.backgroundColor = "darkgrey";
    msgBox.style.color = "white";
  }
  chatContainer.appendChild(msgBox);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

socket.on("typing_list", function (data) {
  const typingUsers = data.userList.filter((el) => el.uid !== uid); // remove current user

  const names = typingUsers.map(user => user.username); // extract names

  typing.textContent = names.length > 0 ? `${names.join(", ")} typing...` : "";
});


socket.on("user_list", function (data) {
  const onn = data.status[0];
  const off = data.status[1];   
  
  const list = document.querySelector("ul");
  list.innerHTML = "";
  
  onn.forEach((data) => {
        
    const item = document.createElement("li");
    const span = document.createElement("span");
    const status = document.createElement("span");
    status.textContent = "🟢";
    span.textContent = data.username;

    item.className = "dropdown-item-text d-flex justify-content-between";
    item.appendChild(span);
    item.appendChild(status);
    list.appendChild(item);
  });

  off.forEach((data) => {
        
    const item = document.createElement("li");
    const span = document.createElement("span");
    const status = document.createElement("span");
    status.textContent = "🔴";
    span.textContent = data.username;

    item.className = "dropdown-item-text d-flex justify-content-between";
    item.appendChild(span);
    item.appendChild(status);
    list.appendChild(item);
  });
});

socket.on("online", function (data) {
  statusHandler(data.username, "is online");
});

socket.on("offline", function (data) {
  statusHandler(data.username, "went offline");
});

socket.on("join", function (data) {
  statusHandler(data.username, "has joined the room");
});

socket.on("left", function (data) {
  statusHandler(data.username, "has left the room");
});

socket.on("readByAll", function (data) {
  markAsRead(data.mid);
});

socket.on("message", function (data) {
  msgMaker(data);
});

socket.on("load_msg", function (data) {
  data.forEach((element) => {
    msgMaker(element);
  });
});
