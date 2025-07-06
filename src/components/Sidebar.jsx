import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Plus,
  User2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createRoomAndJoin } from "../hooks/roomUtils";
import { ROOM_SERVICE_URL } from "../config";

export default function Sidebar({
  setShowLogoutDialog,
  rooms = [],
  onSelectRoom,
  activeRoomId,
  setRooms,
  token,
  username,
  users = [],
  onStartDM,
  dmNameMap = {},
  uid,
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const [showJoinRoomDialog, setShowJoinRoomDialog] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");

  const baseStyle = `flex items-center gap-3 py-2 px-3 rounded transition whitespace-nowrap`;
  const activeStyle = `bg-slate-800 text-blue-400 font-semibold`;

  function handleLogout() {
    logout().then(() => {
      setShowLogoutDialog(true);
      setTimeout(() => {
        setShowLogoutDialog(false);
        navigate("/signin");
      }, 3000);
    });
  }

  async function handleCreateRoom() {
    const room = await createRoomAndJoin({
      name: newRoomName,
      token,
      username,
      setRooms,
      onSelectRoom,
    });
    if (room) {
      setShowNewRoomDialog(false);
      setNewRoomName("");
    }
  }

  async function handleJoinRoomById() {
    try {
      const res = await fetch(`${ROOM_SERVICE_URL}/join_room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rid: joinRoomId }),
      });

      if (!res.ok) throw new Error("Failed to join room");
      const data = await res.json();

      const room = {
        rid: joinRoomId,
        name: data?.roomname || `Room ${joinRoomId.slice(0, 4)}...`,
      };

      setRooms((prev) => [...prev, room]);
      onSelectRoom(joinRoomId);
      setShowJoinRoomDialog(false);
      setJoinRoomId("");
    } catch (err) {
      console.error("Join room failed:", err);
      alert("Invalid or unauthorized room ID.");
    }
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={`h-screen sticky top-0 ${
          sidebarVisible ? "w-64" : "w-20"
        } bg-[#0e1117] text-slate-100 flex flex-col px-2 py-6 shadow-md transition-all duration-300 z-40`}
      >
        {/* Toggle */}
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className="absolute top-4 right-[-1.25rem] bg-slate-800 text-slate-300 hover:text-blue-400 rounded-full p-1 shadow-md z-50"
          title={sidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {sidebarVisible ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img
            src="/barLogo.png"
            alt="Logo"
            className={`rounded-full transition-all duration-300 ${
              sidebarVisible ? "w-20 h-20" : "w-12 h-12"
            }`}
          />
        </div>

        {/* DMs Section */}
{sidebarVisible && (
  <h3 className="text-slate-400 text-sm font-semibold px-2 mb-1">Direct Messages</h3>
)}
<div className="flex flex-col gap-2 mb-4 overflow-y-auto max-h-60">
  {users.map((user) => {
  const dmRoom = rooms.find((room) =>
    room.type === "dm" &&
    ((room.user1 === uid && room.user2 === user.id) ||
     (room.user2 === uid && room.user1 === user.id))
  );

  const isActive = dmRoom?.rid === activeRoomId;

  return (
    <button
      key={user.id}
      onClick={() => onStartDM(user.id)}
      className={`${baseStyle} ${
        isActive ? activeStyle : "hover:bg-slate-700 text-slate-300"
      } ${sidebarVisible ? "justify-start px-4" : "justify-center px-2"}`}
      title={!sidebarVisible ? user.username : ""}
    >
      <User2 className="w-5 h-5" />
      {sidebarVisible && (
        <span className="truncate">{user.username}</span>
      )}
    </button>
  );
})}


</div>


        {/* Rooms Section */}
        {sidebarVisible && (
          <h3 className="text-slate-400 text-sm font-semibold px-2 mb-1">Rooms</h3>
        )}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 w-full">
          {rooms
  .filter((room) => room.type !== "dm") // exclude DMs from Rooms section
  .map((room) => {
    const isActive = activeRoomId === room.rid;
    const displayName = room.name;

    return (
      <button
        key={room.rid}
        onClick={() => onSelectRoom(room.rid)}
        className={`${baseStyle} ${
          isActive
            ? activeStyle
            : "hover:bg-slate-700 text-slate-300"
        } ${sidebarVisible ? "justify-start px-4" : "justify-center px-2"}`}
        title={!sidebarVisible ? displayName : ""}
      >
        <MessageSquareText className="w-5 h-5" />
        {sidebarVisible && (
          <span className="truncate">{displayName}</span>
        )}
      </button>
    );
  })}

        </div>

        {/* Create Room */}
        <div className="w-full px-2 mb-2">
          <button
            onClick={() => setShowNewRoomDialog(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition"
          >
            <Plus size={18} />
            {sidebarVisible && "New Room"}
          </button>
        </div>

        {/* Join Room */}
        <div className="w-full px-2 mb-2">
          <button
            onClick={() => setShowJoinRoomDialog(true)}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded transition"
          >
            <Plus size={18} />
            {sidebarVisible && "Join Room"}
          </button>
        </div>

        {/* Logout */}
        <div className="w-full px-2">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              sidebarVisible ? "justify-center gap-2 px-4" : "justify-center px-2"
            } bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-2 rounded transition`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarVisible && "Logout"}
          </button>
        </div>
      </div>

      {/* Create Room Dialog */}
      {showNewRoomDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#161b22] p-6 rounded-2xl shadow-xl w-[90%] max-w-md space-y-6 text-center border border-slate-700">
            <h2 className="text-xl font-semibold text-slate-100">Create New Room</h2>
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full p-2 rounded bg-[#0e1117] border border-slate-700 text-white"
              placeholder="Room name"
            />
            <div className="flex justify-end gap-4 pt-2">
              <button
                onClick={() => setShowNewRoomDialog(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Dialog */}
      {showJoinRoomDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#161b22] p-6 rounded-2xl shadow-xl w-[90%] max-w-md space-y-6 text-center border border-slate-700">
            <h2 className="text-xl font-semibold text-slate-100">Join Room by ID</h2>
            <input
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="w-full p-2 rounded bg-[#0e1117] border border-slate-700 text-white"
              placeholder="Paste Room ID here"
            />
            <div className="flex justify-end gap-4 pt-2">
              <button
                onClick={() => setShowJoinRoomDialog(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoomById}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg transition"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
