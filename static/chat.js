const username = localStorage.getItem("username");
const roomname = localStorage.getItem("roomname");
if (!username || !roomname) {
  window.location.href = "/";
}

const input = document.querySelector("#chat-input");
const form = input.closest("form");
const chatContainer = document.querySelector("#chat-box");
const changeRoom = document.querySelector("#change_room");
const leaveRoom = document.querySelector("#leave_room");
const title = document.querySelector("h2");
const typing = document.querySelector("#typing");
const navBar = document.querySelector("nav");
const inputBar = document.querySelector("#input-bar");
title.textContent = roomname;

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

const socket = io();

socket.emit("join", { username, roomname });

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
      username: username,
      roomname: roomname,
    });
    input.value = "";
    socket.emit("stop_typing", {
      username: username,
      roomname: roomname,
    });
    input.style.height = "auto";
    inputHeight = input.scrollHeight;
    chatContainer.style.height = msgBoxOrignalHeight + "px";
  }
});

let leaveOrChange = 0;

window.addEventListener("beforeunload", function () {
  if (leaveOrChange === 0) {
    socket.emit("change_room", {
      username: username,
      roomname: roomname,
    });
  } else {
    socket.emit("left", {
      username: username,
      roomname: roomname,
    });
    leaveOrChange = 0;
  }
  localStorage.removeItem("username");
});

leaveRoom.addEventListener("click", (e) => {
  e.preventDefault();
  leaveOrChange = 1;
  window.location.href = "/";
});

changeRoom.addEventListener("click", (e) => {
  e.preventDefault();
  leaveOrChange = 0;
  window.location.href = "/";
});

let typingTimeout;

input.addEventListener("input", (e) => {
  clearTimeout(typingTimeout);

  if (input.value.length > 0) {
    socket.emit("typing", {
      username: username,
      roomname: roomname,
    });

    typingTimeout = setTimeout(() => {
      socket.emit("stop_typing", {
        username: username,
        roomname: roomname,
      });
    }, 5000);
  } else {
    socket.emit("stop_typing", {
      username: username,
      roomname: roomname,
    });
  }
});

socket.on("typing_list", function (userList) {
  list = userList.filter((name) => name !== username);
  typing.textContent = list.length > 0 ? `${list.join(", ")} typing...` : "";
});

socket.on("user_list", function (data) {
  const userList = data.userList;
  const onlineUsers = data.onlineUsers;
  const otherUsers = userList.filter((item) => !onlineUsers.includes(item));
  const list = document.querySelector("ul");
  list.innerHTML = "";

  onlineUsers.forEach((user) => {
    const item = document.createElement("li");
    const span = document.createElement("span");
    const status = document.createElement("span");
    status.textContent = "🟢";
    span.textContent = user;

    item.className = "dropdown-item-text d-flex justify-content-between";
    item.appendChild(span);
    item.appendChild(status);
    list.appendChild(item);
  });

  otherUsers.forEach((user) => {
    const item = document.createElement("li");
    const span = document.createElement("span");
    const status = document.createElement("span");
    status.textContent = "🔴";
    span.textContent = user;
    item.className = "dropdown-item-text d-flex justify-content-between";
    item.appendChild(span);
    item.appendChild(status);
    list.appendChild(item);
  });
});

function statusHandler(username, msg) {
  const status = document.createElement("div");
  status.textContent = username + " " + msg;
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

socket.on("online", function (username) {
  statusHandler(username, "is online");
});

socket.on("offline", function (username) {
  statusHandler(username, "went offline");
});

socket.on("join", function (username) {
  statusHandler(username, "has joined the room");
});

socket.on("left", function (username) {
  statusHandler(username, "has left the room");
});

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('read')) {
          console.log("I was triggered");
          const messageId = entry.target.dataset.mid;
          socket.emit('msgRead', {
            "username": username,
            "roomname": roomname,
            "mid" : messageId
          }); 
          entry.target.classList.add('read');
          observer.unobserve(entry.target);
      }
  });
}, {
  threshold: 0.5
});

function markAsRead(messageId){
  socket.emit('readByAll',{
    "mid" : messageId
  });
  const statusImg = document.querySelector(`[data-mid="${messageId}"]`).querySelector('div').querySelector('img');
  statusImg.style.opacity = 0;
  
  setTimeout(() => {
    statusImg.src = '../static/read.svg'; 
    statusImg.style.opacity = 1;
  }, 500); 
}

socket.on("markAsRead", function (data) {
  markAsRead(data);
});

function msgMaker(data) {
  const isMe = data.username === username;
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

  if (data.readByAll || data.read_by.includes(username)) {
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

  user.textContent = data.username;
  msg.textContent = data.text;
  time.textContent = localDateTime;

  msgBox.appendChild(user);
  msgBox.appendChild(msg);
  msgBox.appendChild(status);

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

socket.on("message", function (data) {
  msgMaker(data);
});

socket.on("load_msg", function (data) {
  data.forEach((element) => {
    msgMaker(element);
  });
});
