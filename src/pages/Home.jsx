import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import BlurText from "../components/BlurText";

export default function Home( { onGetStarted } ) {
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  const handleAnimationComplete = () => {
    console.log("Animation completed!");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Loading Overlay */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <p className="text-white text-xl animate-pulse">Loading 3D...</p>
        </div>
      )}

      {/* Spline Background */}
      <Spline
        scene="https://prod.spline.design/ZqbcK5KGtoPjv9JS/scene.splinecode"
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* Foreground Content */}
      {loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center space-y-6 px-4">
          <BlurText
            text="BlahBlahBlah"
            delay={50}
            animateBy="letters"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className="text-white text-4xl md:text-6xl font-bold"
          />

          <p
            className="text-lg font-medium bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(270deg, #3dfac8, #4079ff, #2fd5a4, #3267e6, #40ffaa)",
              backgroundSize: "200% 200%",
              animation: "gradientMove 5s ease infinite",
            }}
          >
            Say It All — Unfiltered. Unlimited.
          </p>

          <button
  onClick={() => {
    if (typeof onGetStarted === "function") onGetStarted();
    else navigate("/signin"); // fallback in case it's not passed
  }}
  className="mt-6 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-white text-lg transition duration-200"
>
  Start Chatting
</button>

        </div>
      )}

      {/* Inline CSS animation */}
      <style>
        {`
          @keyframes gradientMove {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>
    </div>
  );
}
