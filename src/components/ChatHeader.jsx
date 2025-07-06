import { useState } from "react";
import { ChevronDown, ChevronRight, Info, Users } from "lucide-react";

export default function ChatHeader({
  roomName = "Room Name",
  roomId = "",
  typingUsers = [],
  members = [],
  isDM = false, // NEW
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showRoomId, setShowRoomId] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 relative">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 truncate pl-3">
          {isDM
            ? members.find((m) => m.username !== typingUsers[0]?.username)
                ?.username || "Direct Message"
            : roomName}
        </h2>
        {typingUsers.length > 0 && (
          <div className="text-sm text-slate-400 pl-3">typing…</div>
        )}
      </div>

      {!isDM && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center text-slate-300 hover:text-white"
          >
            <Info size={20} />
            <ChevronDown
              size={16}
              className={`ml-1 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#1c212b] rounded shadow-lg z-50 border border-slate-700 text-sm overflow-hidden">
              {/* Room ID toggle */}
              <button
                type="button"
                onClick={() => setShowRoomId((prev) => !prev)}
                className="w-full px-4 py-2 hover:bg-slate-700 flex justify-between items-center text-slate-100"
              >
                <div className="flex items-center gap-2">
                  <Info size={16} />
                  Room ID
                </div>
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-200 ${
                    showRoomId ? "rotate-90" : ""
                  }`}
                />
              </button>
              {showRoomId && (
                <div className="px-4 py-2 text-slate-400 break-all border-t border-slate-700">
                  {roomId}
                </div>
              )}

              {/* Members toggle */}
              <button
                type="button"
                onClick={() => setShowMembers((prev) => !prev)}
                className="w-full px-4 py-2 hover:bg-slate-700 flex justify-between items-center text-slate-100"
              >
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  Members
                </div>
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-200 ${
                    showMembers ? "rotate-90" : ""
                  }`}
                />
              </button>
              {showMembers && (
                <div className="px-4 py-2 border-t border-slate-700 max-h-40 overflow-y-auto text-slate-200 space-y-1">
                  {members.length === 0 ? (
                    <div className="text-slate-400 text-sm px-4">
                      No members
                    </div>
                  ) : (
                    members.map((m) => (
                      <div
                        key={m.uid}
                        className="flex justify-between text-sm px-4 py-1"
                      >
                        <span>{m.username}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
