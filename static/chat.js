const username = localStorage.getItem("username");
const roomname = localStorage.getItem("roomname");
if (!username || !roomname) {
  window.location.href = "/";
}

const input = document.querySelector("#chat-input");
const form = input.closest('form');
const chatContainer = document.querySelector("#chat-box");
const changeRoom = document.querySelector("#change_room");
const leaveRoom = document.querySelector("#leave_room");
const title = document.querySelector("h2");
const typing = document.querySelector("#typing");
const navBar = document.querySelector("nav");
const inputBar = document.querySelector("#input-bar");
title.textContent = roomname;
let inputHeight = 0;
let chatBoxOrignalHeight = 0;
window.onload = () => {
  inputHeight = input.scrollHeight;
  const navHeight = navBar.offsetHeight;
  const inputBarHeight = inputBar.offsetHeight;
  
  const inputBarPadding = parseFloat(window.getComputedStyle(document.querySelector("#input-bar")).paddingTop);
  const totalHeight = window.innerHeight;
  const remainingHeight = totalHeight - inputBarHeight - inputBarPadding*2;

  chatContainer.style.marginTop = navHeight + "px";
  chatContainer.style.height = remainingHeight + "px";
  chatBoxOrignalHeight = remainingHeight;

  document.querySelector("#offcanvasWithBothOptionsLabel").textContent = username;
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
    chatContainer.style.height = (currentHeight - diff) + "px";
    inputHeight = newHeight;
  }

  this.style.height = newHeight + "px";
  chatContainer.scrollTop = chatContainer.scrollHeight;
});


input.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();  // Prevent newline
    form.requestSubmit(); // Submit form
  }
});


form.addEventListener("submit", function (e) {
  e.preventDefault();

  const message = input.value;
  console.log(message);
  console.log(message.trim());

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
    inputHeight = inputBar.offsetHeight;
    chatContainer.style.height = chatBoxOrignalHeight + "px";
  }
});

leaveRoom.addEventListener("click", (e) => {
  e.preventDefault();
  socket.emit("left", {
    username: username,
    roomname: roomname,
  });
  localStorage.removeItem("username");
  window.location.href = "/";
});

changeRoom.addEventListener("click", (e) => {
  e.preventDefault();
  socket.emit("change_room", {
    username: username,
    roomname: roomname,
  });
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

window.addEventListener("beforeunload", function () {
  localStorage.removeItem("username");
});

socket.on("online", function (username) {
  const joinAlert = document.createElement("div");
  joinAlert.textContent = username + " is online";
  joinAlert.style.width = "max-content";
  joinAlert.style.maxWidth = "75%";
  joinAlert.style.borderRadius = "12px";
  joinAlert.className = "d-block m-2 p-2 text-wrap text-break";
  joinAlert.classList.add("mx-auto");
  joinAlert.style.backgroundColor = "black";
  joinAlert.style.color = "white";
  chatContainer.appendChild(joinAlert);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on("offline", function (username) {
  const joinAlert = document.createElement("div");
  joinAlert.textContent = username + " went offline";
  joinAlert.style.width = "max-content";
  joinAlert.style.maxWidth = "75%";
  joinAlert.style.borderRadius = "12px";
  joinAlert.className = "d-block m-2 p-2 text-wrap text-break";
  joinAlert.classList.add("mx-auto");
  joinAlert.style.backgroundColor = "black";
  joinAlert.style.color = "white";
  chatContainer.appendChild(joinAlert);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on("join", function (username) {
  const joinAlert = document.createElement("div");
  joinAlert.textContent = username + " has joined the room";
  joinAlert.style.width = "max-content";
  joinAlert.style.maxWidth = "75%";
  joinAlert.style.borderRadius = "12px";
  joinAlert.className = "d-block m-2 p-2 text-wrap text-break";
  joinAlert.classList.add("mx-auto");
  joinAlert.style.backgroundColor = "black";
  joinAlert.style.color = "white";
  chatContainer.appendChild(joinAlert);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on("left", function (username) {
  const leftAlert = document.createElement("div");
  leftAlert.textContent = username + " has left the room";
  leftAlert.style.width = "max-content";
  leftAlert.style.maxWidth = "75%";
  leftAlert.style.borderRadius = "12px";
  leftAlert.className = "d-block m-2 p-2 text-wrap text-break";
  leftAlert.classList.add("mx-auto");
  leftAlert.style.backgroundColor = "black";
  leftAlert.style.color = "white";
  chatContainer.appendChild(leftAlert);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on("message", function (data) {
  console.log(data.text);
  const isMe = data.username === username;
  const chatBox = document.createElement("div");
  const user = document.createElement("h6");
  const msg = document.createElement("p");
  msg.classList = "message-body";

  user.textContent = data.username;
  msg.textContent = data.text;

  chatBox.appendChild(user);
  chatBox.appendChild(msg);

  chatBox.style.width = "max-content";
  chatBox.style.maxWidth = "75%";
  chatBox.style.borderRadius = "12px";
  chatBox.className = "d-block m-2 p-2 text-wrap text-break";

  if (isMe) {
    chatBox.classList.add("ms-auto");
    chatBox.style.backgroundColor = "lightgreen";
  } else {
    chatBox.style.backgroundColor = "darkgrey";
    chatBox.style.color = "white";
  }

  chatContainer.appendChild(chatBox);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on("load_msg", function (data) {
  data.forEach((element) => {
    const isMe = element.username === username;
    const chatBox = document.createElement("div");
    const user = document.createElement("h6");
    const msg = document.createElement("p");

    user.textContent = element.username;
    msg.textContent = element.text;

    chatBox.appendChild(user);
    chatBox.appendChild(msg);

    chatBox.style.width = "max-content";
    chatBox.style.maxWidth = "75%";
    chatBox.style.borderRadius = "12px";
    chatBox.className = "d-block m-2 p-2 text-wrap text-break";

    if (isMe) {
      chatBox.classList.add("ms-auto");
      chatBox.style.backgroundColor = "lightgreen";
    } else {
      chatBox.style.backgroundColor = "darkgrey";
      chatBox.style.color = "white";
    }

    chatContainer.appendChild(chatBox);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
});
