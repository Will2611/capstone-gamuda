import { Link } from "react-router";
import { Button } from "../components/Button";

export default function SignUpPage() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-bs-neutral-100 flex items-center justify-center py-12 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-bs-neutral-200 text-center">
        <h1 className="mb-3">Sign Up</h1>
        <p className="text-bs-neutral-600 mb-6">
          Account registration is coming soon. Use demo credentials on the login
          page for now.
        </p>
        <Link to="/login">
          <Button className="w-full">Back to Login</Button>
        </Link>
      </div>
    </div>
  );
}
