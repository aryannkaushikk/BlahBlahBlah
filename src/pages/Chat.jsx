import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { useAuth } from "../context/AuthContext";
import useRooms from "../hooks/useRooms";
import { io } from "socket.io-client";
import { CHAT_SERVICE_URL } from "../config";
import { supabase } from "../supabaseClient";

export default function Chat({ setShowLogoutDialog }) {
  const { user } = useAuth();
  const uid = user?.id;
  const username = user?.user_metadata?.name || null;

  const [token, setToken] = useState(null);
  const { rooms, setRooms } = useRooms();
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const fetchToken = async () => {
      const { data } = await supabase.auth.getSession();
      setToken(data?.session?.access_token);
    };
    fetchToken();
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeRoomId]);

  const joinRoom = (rid) => {
    if (!token || !rid || !uid || !username) return;

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("leaveRoom", { uid, rid: activeRoomId, username });
      socketRef.current.disconnect();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;

    const socket = io(CHAT_SERVICE_URL, {
      auth: { token, rid },
      autoConnect: false,
    });

    socket.connect();
    socketRef.current = socket;

    setActiveRoomId(rid);
    setMessages([]);
    setTypingUsers([]);
    setRoomMembers([]);
    setLoadingMessages(true);

    socket.on("load_msg", (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing_list", ({ userList }) => {
      setTypingUsers(userList.filter((u) => u.uid !== uid));
    });

    socket.on("readByAll", ({ mid }) => {
      setMessages((prev) =>
        prev.map((m) => (m.mid === mid ? { ...m, readByAll: true } : m))
      );
    });

    socket.on("user_list", ({ status }) => {
      console.log(status);
      const [members] = status;
      setRoomMembers(members || []);
    });
  };

  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      if (socket && socket.connected && activeRoomId) {
        socket.emit("leaveRoom", { uid, rid: activeRoomId, username });
        socket.disconnect();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeRoomId, uid, username]);

  const handleSend = (text) => {
    if (!text || !socketRef.current || !activeRoomId) return;

    socketRef.current.emit("message", {
      uid,
      rid: activeRoomId,
      text,
      sender: username,
    });

    handleTyping(false);
  };

  const handleTyping = (isTyping) => {
    const socket = socketRef.current;
    if (!socket || !activeRoomId) return;

    if (isTyping) {
      if (!isTypingRef.current) {
        socket.emit("typing", { uid, username, rid: activeRoomId });
        isTypingRef.current = true;
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { uid, rid: activeRoomId });
        isTypingRef.current = false;
      }, 3000);
    } else {
      if (isTypingRef.current) {
        socket.emit("stop_typing", { uid, rid: activeRoomId });
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const activeRoom = rooms.find((r) => r.rid === activeRoomId);

  return (
    <div className="flex h-screen bg-[#0e1117] text-slate-100">
      <Sidebar
        token={token}
        username={username}
        rooms={rooms}
        setRooms={setRooms}
        activeRoomId={activeRoomId}
        onSelectRoom={joinRoom}
        setShowLogoutDialog={setShowLogoutDialog}
        socketRef={socketRef}
      />

      <div className="flex flex-col w-full h-screen bg-[#161b22]">
        <ChatHeader
          roomName={activeRoom?.name || "Select a Room"}
          roomId={activeRoomId}
          typingUsers={typingUsers}
          members={roomMembers}
        />

        <div className="flex-1 overflow-y-auto p-4">
          {loadingMessages ? (
  <div className="flex flex-col gap-3 w-full">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className={`h-[40px] rounded-lg animate-pulse ${
          i % 2 === 0
            ? "self-start bg-slate-700 w-[30%]"
            : "self-end bg-blue-600 w-[30%]"
        }`}
      ></div>
    ))}
  </div>
) : (
  <>
    <MessageList
      messages={messages}
      currentUserId={uid}
      socket={socketRef.current}
      roomId={activeRoomId}
    />
    <div ref={messageEndRef} />
  </>
)}

        </div>

        <div className="bg-slate-800 p-4 border-t border-slate-700">
          {activeRoomId ? (
            <MessageInput
              onSend={handleSend}
              onTyping={handleTyping}
              inputRef={inputRef}
            />
          ) : (
            <div className="text-slate-400 text-sm">
              Select a room to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
