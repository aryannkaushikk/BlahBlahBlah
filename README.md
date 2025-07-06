# 💬 BlahBlahBlah v3 — Real-Time Chat App

A fully-featured, real-time chat application built with a modular **microservices backend**, **Supabase for authentication and storage**, and a modern **React + Tailwind** frontend.

Supports:

- 🔒 Auth via Supabase
- 📱 Direct Messages (DMs)
- 🧑‍🤝‍🧑 Group Rooms
- 💬 Real-time messaging
- ✍️ Typing indicators
- ✅ Read receipts (infra-ready)
- ⚡ Redis + Socket.IO for instant communication
- 🐳 Dockerized microservices ready for production

---

## 🖼️ Live Demo

Frontend: [blah-blah-blah-two.vercel.app](https://blah-blah-blah-two.vercel.app)

---

## ⚙️ Tech Stack

### 🧠 Frontend
- React + Vite
- Tailwind CSS
- React Router
- Context API for auth state
- Socket.IO client

### 🧰 Backend Microservices
- Flask (Room, Chat, Message, Gateway services)
- Flask-SocketIO (Chat service)
- Supabase (Auth + Database)
- Redis (Pub/Sub + real-time state)
- Gunicorn (WSGI server)
- Dockerized (independent builds for each service)

---

## 📂 Project Structure

```
BlahBlahBlah/
├── Backend/
│   ├── chat_service/       # Handles WebSockets, message events
│   ├── room_service/       # Manages room creation & membership
│   ├── message_service/    # Handles message storage & read status
│   └── gateway/            # API gateway (optional)
├── public/                 # Static assets
├── src/
│   ├── components/         # ChatHeader, Sidebar, MessageList, etc.
│   ├── pages/              # /chat, /signin, /signup
│   ├── hooks/              # useRooms, useAuth, etc.
│   └── context/            # AuthContext
└── docker-compose.yml      # For local orchestration
```

---

## 🚀 Features

### ✅ Authentication
- Powered by Supabase
- JWT-based, no cookies
- Auto-redirects based on auth state

### 💬 Messaging
- Realtime messaging via Flask-SocketIO + Redis
- Room-based + DM support
- Read receipts & typing indicators
- Auto-scroll to latest message
- Shift+Enter for multiline messages

### 🧠 Smart UI
- Group rooms show room name and who is typing
- DMs show other user’s name, hide yours
- DM typing indicator: only `"typing..."`

### 🎨 UI/UX
- Dark mode only, techy yet clean
- Fully responsive layout (mobile-friendly)
- Sidebar split between DMs and Rooms
- Modals for creating and joining rooms

---

## 🐳 Running Locally (Dev)

Make sure you have:
- Docker + Docker Compose
- Supabase project setup (see `.env.example`)

### 1. Clone & Configure

```bash
git clone -b v3 https://github.com/aryannkaushikk/BlahBlahBlah.git
cd BlahBlahBlah
cp .env.example .env  # fill in Supabase keys
```

### 2. Start Backend

```bash
docker-compose up --build
```

> Services run on:
- `chat_service`: port `8080`
- `room_service`: port `5800`
- `message_service`: port `5600`
- `redis`: port `6379`

### 3. Start Frontend

```bash
cd frontend/
npm install
npm run dev
```

---

## 🧪 API Overview

Each backend service handles a specific domain:

### `room_service` (port 5800)
- `POST /create_room`  
- `POST /join_room`  
- `GET /getUsers`  
- `POST /delUserroom`

### `message_service` (port 5600)
- `POST /send_message`  
- `GET /get_messages?rid=...`  
- `POST /mark_read`

### `chat_service` (port 8080)
- WebSocket for real-time messaging
- `on connect`, `send_message`, `typing`, `stop_typing`, etc.

All services:
- Use Supabase JWT in `Authorization: Bearer <token>`
- Decode `uid` and `username` from token server-side

---

## 📦 Deployment

### ✅ Frontend
Deployed via **Vercel**

- Production Branch: `v3`
- Static assets (like `barLogo.png`) go in `/public`
- Uses environment variables from Supabase

### ✅ Backend
Deployed via **Render.com** (or any Docker-compatible host)

Each service:
- Has its own `Dockerfile` inside `chat_service/`, `room_service/`, etc.
- Uses Render's Docker build with context set to correct folder

---

## 🔐 Auth Design

- Supabase handles JWT auth
- `uid` is passed to all backend services via headers
- All messages and room links are stored with `uid` foreign key
- No cookie/session used — pure token-based

---

## ✨ Roadmap

- [ ] User avatars
- [ ] Online/offline status
- [ ] Message reactions
- [ ] Image/file attachments
- [ ] Admin-only rooms

---

## 🤝 Contributing

Want to add a feature or fix a bug?

1. Fork this repo
2. Create a new branch: `git checkout -b feature-name`
3. Commit & push
4. Open a pull request 🚀

---

## 🧑‍💻 Author

Made with passion by [@aryannkaushikk](https://github.com/aryannkaushikk)

---

## 📜 License

MIT — free to use and modify