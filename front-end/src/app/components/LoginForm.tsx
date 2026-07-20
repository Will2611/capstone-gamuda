import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { FormField } from "./FormField";
import { Button } from "./Button";

interface LoginFormProps {
  // Modified to optionally return the role string upon success
  onSubmit: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; role?: string }>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [touched, setTouched] = useState({ email: false, password: false });

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address";
    }
    if (!password) {
      next.password = "Password is required";
    } else if (password.length < 6) {
      // Changed to 8 to match your Pydantic backend validation constraint!
      next.password = "Password must be at least 8 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validate()) return;

    const result = await onSubmit(email, password);
    if (!result.success) {
      setErrors((prev) => ({ ...prev, form: result.error ?? "Login failed" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.form && (
        <div className="p-3 rounded-lg bg-bs-red/10 border border-bs-red/30 text-sm text-bs-red">
          {errors.form}
        </div>
      )}

      <FormField
        label="Email"
        type="email"
        icon={<Mail size={20} />}
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (touched.email) validate();
        }}
        onBlur={() => {
          setTouched((t) => ({ ...t, email: true }));
          validate();
        }}
        error={touched.email ? errors.email : undefined}
        autoComplete="email"
        disabled={isLoading}
      />

      <div className="relative">
        <FormField
          label="Password"
          type={showPassword ? "text" : "password"}
          icon={<Lock size={20} />}
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (touched.password) validate();
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, password: true }));
            validate();
          }}
          error={touched.password ? errors.password : undefined}
          autoComplete="current-password"
          disabled={isLoading}
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-bs-neutral-500 hover:text-bs-neutral-700"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-bs-neutral-700">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-bs-neutral-300 text-bs-gold focus:ring-bs-gold/30"
          />
          Remember Me
        </label>
        <button
          type="button"
          className="text-sm text-bs-blue hover:underline"
          onClick={() => alert("Password reset coming soon!")}
        >
          Forgot Password?
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Log In"}
      </Button>

      <p className="text-center text-sm text-bs-neutral-600">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="text-bs-gold font-medium hover:underline">
          Sign Up
        </Link>
      </p>

      <p className="text-center text-xs text-bs-neutral-500 pt-2">
        Demo: demo@bitescouts.com / password123
      </p>
    </form>
  );
}
