import { useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { useAuth, type Role } from "../context/AuthContext";

import { SignUpFormClient } from "../components/SignUpFormClient";
import { SignUpFormOwner } from "../components/SignUpFormOwner";

export default function SignUpPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const [selectedRole, setSelectedRole] = useState<Role>("client");

  const isEditMode = searchParams.get("mode") === "edit";

  if (isAuthenticated && !isEditMode) {
    return <Navigate to="/map" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-bs-gold/10 via-white to-bs-blue/10 flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="mb-2">
            {isEditMode ? "Update Profile" : "Create Account"}
          </h1>

          <p className="text-bs-neutral-600">
            {isEditMode
              ? "Modify your profile information and dining preferences"
              : "Join BiteScouts and discover great food"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-bs-neutral-200">
          {!isEditMode && (
            <div className="flex gap-4 mb-8">
              <button
                type="button"
                onClick={() => setSelectedRole("client")}
                className={`flex-1 py-3 rounded-xl border transition-all ${
                  selectedRole === "client"
                    ? "bg-bs-gold border-bs-gold text-white"
                    : "border-bs-neutral-300 hover:border-bs-gold"
                }`}
              >
                Personal Acocunt
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("owner")}
                className={`flex-1 py-3 rounded-xl border transition-all ${
                  selectedRole === "owner"
                    ? "bg-bs-gold border-bs-gold text-white"
                    : "border-bs-neutral-300 hover:border-bs-gold"
                }`}
              >
                Restaurant Owner
              </button>
            </div>
          )}

          {isEditMode || selectedRole === "client" ? (
            <SignUpFormClient />
          ) : (
            <SignUpFormOwner />
          )}
        </div>
      </div>
    </div>
  );
}
