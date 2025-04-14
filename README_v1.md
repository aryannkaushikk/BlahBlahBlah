# 💬 Flask Chat App — Version 1

A real-time chat application built using Flask, Socket.IO, and PostgreSQL.  
Users can join chat rooms, send messages, and see who's online — all in real time.

---

## 🚀 Features (Version 1)

- ✅ **Username-based User System**  
  Users join with a unique username. No registration needed.

- ✅ **Room-Based Messaging**  
  Users can join or create rooms on the fly. Messages are sent only within that room.

- ✅ **Real-Time Communication**  
  Powered by **Flask-SocketIO** — updates happen instantly without page refresh.

- ✅ **Persistent Messages**  
  Messages are stored in a PostgreSQL database and loaded when a user joins a room.

- ✅ **User Presence Tracking**  
  Real-time display of users present in a room. Live updates on join/leave.

- ✅ **Backend Logic**  
  - Custom string-based IDs (`UID#`, `RID#`, `MID#`) for all records  
  - Robust relationship modeling using SQLAlchemy  
  - Separate tables for `Users`, `Rooms`, `Messages`, and `UserRoom` associations

---

## 🛠️ Tech Stack & Development Journey

This version was developed as the foundational release of a long-term chat application project.

### 🔧 Tech Stack

- **Backend:** Flask, Flask-SocketIO, Flask-SQLAlchemy  
- **Database:** PostgreSQL  
- **Frontend:** Jinja2 templates (HTML), Vanilla JS  
- **Realtime:** WebSockets via Socket.IO  
- **Environment Management:** `python-dotenv`

### 🧠 Journey Highlights

- 🧩 Designed a normalized PostgreSQL schema for chat data  
- 🛠️ Implemented real-time messaging using Flask-SocketIO  
- 🔄 Built message persistence and loading on room join  
- 🔒 Modeled relationships between users and rooms with many-to-many logic  
- 🧪 Focused on ensuring room isolation, message order, and user uniqueness  
- 🔧 Created custom ID patterns for better debugging and control

---

## 🧪 Running Locally

1. **Clone the repo**
2. **Set up PostgreSQL** (local or use a managed service like Neon)
3. **Create `.env` file** in the root:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/yourdbname
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the app**:
   ```bash
   python app.py
   ```

6. Open in browser:  
   [http://localhost:8080](http://localhost:8080)

---

## 🎯 What’s Next (Version 2 Ideas)

- 🔐 User authentication (sign up / login)  
- 🔒 Private & public rooms  
- 📸 Media sharing (images, files)  
- 📱 Responsive UI (React / Vue frontend)  
- ✏️ Message editing & deletion  
- 👀 Typing indicators & read receipts  

---

## 📃 License

MIT License

---

## 👨‍💻 Author

Built with ❤️ by Aryan Kaushik  
_B.Tech CS-AIML Student • Passionate about AI & Web Development_

---