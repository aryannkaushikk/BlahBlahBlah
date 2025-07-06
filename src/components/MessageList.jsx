import { useEffect, useRef } from "react";
import { Check, CheckCheck } from "lucide-react";

export default function MessageList({ messages = [], currentUserId, socket, roomId }) {
  const msgRefs = useRef({});

  useEffect(() => {
    if (!socket || !roomId || !currentUserId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const mid = entry.target.getAttribute("data-mid");
          const msg = messages.find((m) => m.mid === mid);

          if (
            entry.isIntersecting &&
            msg &&
            msg.uid !== currentUserId &&
            !msg.read_by_users?.includes(currentUserId)
          ) {
            socket.emit("msgRead", {
              uid: currentUserId,
              mid,
              rid: roomId,
            });

            observer.unobserve(entry.target); // ✅ Stop observing after read
          }
        });
      },
      { threshold: 0.8 }
    );

    Object.values(msgRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect(); // Cleanup
  }, [messages, currentUserId, socket, roomId]);

  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => {
        const isOwn = msg.uid === currentUserId;

        return (
          <div
            key={msg.mid}
            ref={(el) => (msgRefs.current[msg.mid] = el)}
            data-mid={msg.mid}
            className={`max-w-[75%] px-4 py-2 rounded-lg shadow-sm text-sm break-words transition-colors ${
              isOwn
                ? "self-end bg-blue-600 text-white"
                : "self-start bg-slate-700 text-slate-100"
            }`}
          >
            {!isOwn && (
              <div className="text-xs font-semibold mb-1 text-slate-300">
                {msg.sender}
              </div>
            )}

            <div className="whitespace-pre-wrap">{msg.text}</div>

            <div className="text-xs text-slate-400 mt-1 flex justify-end items-center gap-1">
              {new Date(msg.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

              {isOwn && (
                <span className="ml-2 transition-opacity duration-300">
                  {msg.readByAll ? (
                    <CheckCheck size={16} className="text-white" />
                  ) : (
                    <Check size={16} className="text-white/60" />
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
