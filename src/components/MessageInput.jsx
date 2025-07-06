import { useState, useRef, useEffect } from "react";

export default function MessageInput({ onSend, onTyping, inputRef }) {
  const [text, setText] = useState("");
  const localRef = useRef(null);
  const textareaRef = inputRef || localRef;

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    onTyping?.(value.length > 0);
    adjustHeight();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!text.trim()) return;
      onSend(text.trim());
      setText("");
      onTyping?.(false);
      adjustHeight(true); // reset height
    }
  };

  const adjustHeight = (reset = false) => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = reset ? "auto" : "0px";
    const scrollHeight = el.scrollHeight;
    const maxHeight = 5 * 24; // 5 lines * 24px line-height

    el.style.height = Math.min(scrollHeight, maxHeight) + "px";
    el.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex items-end gap-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 resize-none max-h-[120px] min-h-[36px] p-2 rounded bg-[#0e1117] border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 leading-6"
        rows={1}
      />
      <button
        type="submit"
        onClick={() => {
          if (!text.trim()) return;
          onSend(text.trim());
          setText("");
          onTyping?.(false);
          adjustHeight(true);
        }}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition"
      >
        Send
      </button>
    </form>
  );
}
