import { Dialog } from "@headlessui/react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const statusMessages = {
  checking: {
    title: "Starting server...",
    description: "Our backend is hosted on Render, which may introduce a cold start delay of up to 50 seconds if the service has been inactive. We're currently reaching the server — hang tight while it warms up or come back after 1-2 minutes!",
    icon: <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />,
  },
  ready: {
    title: "All Systems Ready",
    description: "You’re good to go!",
    icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
  },
  error: {
    title: "Servers Unreachable",
    description: "We couldn’t reach the servers. Please try again later.",
    icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
  },
};

export default function HealthCheckDialog({ status, onClose }) {
  const { title, description, icon } = statusMessages[status];

  return (
    <Dialog open={true} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm text-center">
          <div className="flex justify-center mb-4">{icon}</div>
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <p className="text-sm text-gray-500 mt-2">{description}</p>
          {status === "ready" || status === "error" ? (
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Close
            </button>
          ) : null}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
