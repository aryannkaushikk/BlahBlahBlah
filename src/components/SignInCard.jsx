import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { FaGoogle } from "react-icons/fa";

export default function SignInCard() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const {
    mutate: emailSignIn,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: signIn,
    onSuccess: () => navigate("/chat"),
  });

  const { mutate: googleSignIn, isPending: googlePending } = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: () => navigate("/chat"),
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    emailSignIn(formData);
  }

  function toSignUp() {
    navigate("/signUp");
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-3 py-6 md:px-6 md:py-12 lg:px-8 w-2xs md:w-md bg-[#161b22] rounded-xl shadow-xl border border-slate-700">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <button
          onClick={() => navigate("/")}
          className="block mx-auto cursor-pointer"
        >
          <img alt="Logo" src="/barLogo.png" className="h-20 w-auto" />
        </button>

        <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-slate-100">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm p-6 bg-[#0e1117] rounded-xl border border-slate-800 space-y-6">
        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="block w-full rounded-md bg-[#0e1117] border border-slate-700 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="text-sm">
                <a
                  href="#"
                  className="font-semibold text-blue-400 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="block w-full rounded-md bg-[#0e1117] border border-slate-700 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Error Message */}
          {isError && (
            <p className="text-sm text-red-500 font-medium">{error.message}</p>
          )}

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
            >
              {isPending ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        {/* <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-xs text-slate-400 font-semibold">OR</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div> */}

        {/* Google Button */}
        {/* <button
          onClick={() => googleSignIn()}
          disabled={googlePending}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-600 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          {googlePending ? (
            <span className="w-5 h-5 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></span>
          ) : (
            <FaGoogle className="w-5 h-5" />
          )}
          Continue with Google
        </button> */}

        {/* Sign up prompt */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Not a member?{" "}
          <button
            onClick={toSignUp}
            className="font-semibold text-blue-400 hover:underline"
          >
            SignUp
          </button>
        </p>
      </div>
    </div>
  );
}
