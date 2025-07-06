import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

export default function SignUpCard() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: signUp,
    onSuccess: () => navigate("/chat"),
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { email, password, confirmPassword, name } = formData;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    mutate({ email, password, name });
  }

  function toSignIn() {
    navigate("/signIn");
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-3 py-3 lg:px-6 lg:w-md w-2xs bg-[#161b22] rounded-xl m-6 md:m-0 shadow-xl border border-slate-700">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <button
          onClick={() => navigate("/")}
          className="block mx-auto cursor-pointer"
        >
          <img alt="Your Company" src="/barLogo.png" className="h-20 w-auto" />
        </button>

        <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-slate-100">
          Create your BlahBlahBlah account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm p-6 bg-[#0e1117] rounded-xl border border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          {["name", "email", "password", "confirmPassword"].map((field, i) => (
            <div key={i}>
              <label
                htmlFor={field}
                className="block text-sm font-medium text-slate-300 capitalize"
              >
                {field === "confirmPassword" ? "Confirm Password" : field}
              </label>
              <div className="mt-2">
                <input
                  id={field}
                  name={field}
                  type={
                    field === "password" || field === "confirmPassword"
                      ? "password"
                      : "text"
                  }
                  required
                  value={formData[field]}
                  onChange={handleChange}
                  autoComplete={field}
                  placeholder={`Enter your ${
                    field === "confirmPassword" ? "password again" : field
                  }`}
                  className="block w-full rounded-md bg-[#0e1117] border border-slate-700 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          ))}

          {isError && (
            <p className="text-sm text-red-500 font-medium">{error.message}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
            >
              {isPending ? "Signing up..." : "Sign up"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-slate-400">
          Already a member?{" "}
          <button
            onClick={toSignIn}
            className="font-semibold text-blue-400 hover:underline"
          >
            SignIn
          </button>
        </p>
      </div>
    </div>
  );
}
