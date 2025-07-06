import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import LogoutDialog from "./components/LogoutDialog";
import PrivateRoute from "./components/PrivateRoute"
import { useState } from "react";

function App() {

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  return (
    <>
      {showLogoutDialog && (
        <LogoutDialog open={showLogoutDialog} onClose={() => setShowLogoutDialog(false)} />
      )}

      <Routes>
        <Route path="/" element={<Home />} />
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