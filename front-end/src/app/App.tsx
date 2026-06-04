import { BrowserRouter, Routes, Route } from "react-router";
import { lazy } from "react";
import { Navigation } from "./components/Navigation";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import "maplibre-gl/dist/maplibre-gl.css";
import { FoodMatchProvider } from "./context/FoodMatchContext";

// import LandingPage from "./screens/LandingPage";
// import PreferenceForm from "./screens/PreferenceForm";
// import MapInterface from "./screens/MapInterface";
// import SuggestionsPage from "./screens/SuggestionsPage";
// import OwnerDashboard from "./screens/OwnerDashboard";
// import PrivacyPage from "./screens/PrivacyPage";
// import BusinessPage from "./screens/BusinessPage";
// import LoginPage from "./screens/LoginPage";
// import SignUpPage from "./screens/SignUpPage";
// import UserProfile from "./screens/UserProfile";
// import FoodMatch from "./screens/FoodMatch";

const LandingPage = lazy(() => import("./screens/LandingPage"));
const PreferenceForm = lazy(() => import("./screens/PreferenceForm"));
const MapInterface = lazy(() => import("./screens/MapInterface"));
const SuggestionsPage = lazy(() => import("./screens/SuggestionsPage"));
const OwnerDashboard = lazy(() => import("./screens/OwnerDashboard"));
const PrivacyPage = lazy(() => import("./screens/PrivacyPage"));
const BusinessPage = lazy(() => import("./screens/BusinessPage"));
const LoginPage = lazy(() => import("./screens/LoginPage"));
const SignUpPage = lazy(() => import("./screens/SignUpPage"));
const UserProfile = lazy(() => import("./screens/UserProfile"));
const FoodMatch = lazy(() => import("./screens/FoodMatch"));

const SocialVisibilityDashboard = lazy(
  () => import("./screens/SocialVisibilityDashboard"),
);
import PWABadge from "./PWABadge";
import PromotionManagement from "./screens/PromotionManagement";
import PromotionFormPage from "./screens/PromotionFormPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <FoodMatchProvider>
            <PWABadge>
              <div className="min-h-screen bg-white">
                <Navigation />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/map" element={<MapInterface />} />
                  <Route path="/suggestions" element={<SuggestionsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/business" element={<BusinessPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  {/* Update to nested in /user */}
                  {/* Update to be in /user/profile */}
                  <Route path="/profile" element={<UserProfile />} />
                  {/* Update to be in /user/updatePreference */}
                  <Route path="/search" element={<PreferenceForm />} />
                  {/* Update to nested in /owner */}
                  <Route path="/dashboard" element={<OwnerDashboard />} />
                  <Route path="/food-match" element={<FoodMatch />} />
                  <Route
                    path="/social-visibility"
                    element={<SocialVisibilityDashboard />}
                  />
                  <Route path="/promotion" element={<PromotionManagement />} />
                  <Route
                    path="/promotion-form"
                    element={<PromotionFormPage />}
                  />

                  <Route
                    path="/promotion/edit/:promoId"
                    element={<PromotionFormPage />}
                  />
                </Routes>
              </div>
            </PWABadge>
          </FoodMatchProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
