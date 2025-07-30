import { Routes, Route, useNavigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import LogoutDialog from "./components/LogoutDialog";
import PrivateRoute from "./components/PrivateRoute";
import HealthCheckDialog from "./components/HealthCheckDialog";
import { useState, useEffect } from "react";

const CHAT_URL = import.meta.env.VITE_CHAT_SERVICE_URL;
const MSG_URL = import.meta.env.VITE_MESSAGE_SERVICE_URL;
const ROOM_URL = import.meta.env.VITE_ROOM_SERVICE_URL;

function App() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking"); // "checking" | "ready" | "error"
  const [showHealthDialog, setShowHealthDialog] = useState(false);

  // Health check logic
  useEffect(() => {
    const healthEndpoints = [
      `${CHAT_URL}/healthz`,
      `${MSG_URL}/healthz`,
      `${ROOM_URL}/healthz`,
    ];

    const timeout = 2 * 60 * 1000; // 2 minutes
    const retries = 3;
    const delayBetweenRetries = 50000; // 5 seconds

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

    const checkHealth = async (url) => {
      for (let i = 0; i < retries; i++) {
        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          if (res.ok) return true;
        } catch (err) {
          // optional: console.log(err.message)
        }
        await sleep(delayBetweenRetries);
      }
      return false;
    };

    const runHealthCheck = async () => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const results = await Promise.all(healthEndpoints.map(checkHealth));
        if (results.every((r) => r === true)) {
          setBackendStatus("ready");
          return;
        }
        await sleep(3000);
      }
      setBackendStatus("error");
    };

    runHealthCheck();
  }, []);

  const navigate = useNavigate();

  return (
    <>
      {showLogoutDialog && (
        <LogoutDialog
          open={showLogoutDialog}
          onClose={() => setShowLogoutDialog(false)}
        />
      )}

      {showHealthDialog && (
        <HealthCheckDialog
          status={backendStatus}
          onClose={() => setShowHealthDialog(false) }
        />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Home
              onGetStarted={() => {
                if (backendStatus === "ready") {
                  navigate("/signin");
                } else {
                  setShowHealthDialog(true);
                }
              }}
            />
          }
        />

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat setShowLogoutDialog={setShowLogoutDialog} />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
