import { useEffect } from "react";

export default function LogoutDialog({ open, onClose }) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] p-6 rounded-2xl shadow-2xl w-[90%] max-w-md space-y-6 text-center border border-slate-700">
        <h2 className="text-xl font-semibold text-white">Logged Out</h2>
        <p className="text-slate-300">You’ve successfully logged out.</p>
        <button
          onClick={onClose}
          className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2 rounded-lg transition duration-200"
        >
          OK
        </button>
      </div>
    </div>
  );
}
