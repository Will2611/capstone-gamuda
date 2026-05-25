import { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/map" replace />;
  }

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      navigate("/map", { replace: true });
    }
    return result;
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-bs-gold/10 via-white to-bs-blue/10 flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bs-gold/20 mb-4">
            <svg
              width="40"
              height="40"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="#FFD700"
                stroke="#FF4C4C"
                strokeWidth="2"
              />
              <path
                d="M12 12L16 8L20 12M12 16H20M14 20L16 22L18 20"
                stroke="#FF4C4C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mb-2">Welcome back</h1>
          <p className="text-bs-neutral-600">
            Sign in to discover your next favorite meal
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-bs-neutral-200">
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
