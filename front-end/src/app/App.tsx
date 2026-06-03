import { BrowserRouter, Routes, Route } from "react-router";
import { Navigation } from "./components/Navigation";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { LandingPage } from "./screens/LandingPage";
import { PreferenceForm } from "./screens/PreferenceForm";
import { MapInterface } from "./screens/MapInterface";
import { SuggestionsPage } from "./screens/SuggestionsPage";
import { OwnerDashboard } from "./screens/OwnerDashboard";
import { PrivacyPage } from "./screens/PrivacyPage";
import { BusinessPage } from "./screens/BusinessPage";
import { LoginPage } from "./screens/LoginPage";
import { SignUpPage } from "./screens/SignUpPage";
import { UserProfile } from "./screens/UserProfile";
import { SocialVisibilityDashboard } from "./screens/SocialVisibilityDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <div className="min-h-screen bg-white">
            <Navigation />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/search" element={<PreferenceForm />} />
              <Route path="/map" element={<MapInterface />} />
              <Route path="/suggestions" element={<SuggestionsPage />} />
              <Route path="/dashboard" element={<OwnerDashboard />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route
                path="/social-visibility"
                element={<SocialVisibilityDashboard />}
              />
            </Routes>
          </div>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
