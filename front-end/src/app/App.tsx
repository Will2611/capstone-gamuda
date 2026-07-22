import { BrowserRouter, Routes, Route } from "react-router";
import { lazy, useEffect, useMemo, type ReactNode } from "react";
import { Navigation } from "./components/Navigation";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UserProvider, useUser } from "./context/UserContext";
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
const MapInterface = lazy(() => import("./screens/MapInterface"));
const SuggestionsPage = lazy(() => import("./screens/SuggestionsPage"));
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
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingProvider, useLoading } from "./context/LoadingContext";

function ContextNest({ children }: { children: ReactNode }) {
  return (
    <LoadingProvider>
      <AuthProvider>
        <UserProvider>
          <FoodMatchProvider>
            <PWABadge>{children}</PWABadge>
          </FoodMatchProvider>
        </UserProvider>
      </AuthProvider>
    </LoadingProvider>
  );
}
function RoutesCompiled() {
  const { user } = useAuth();
  const { isLoading } = useLoading();

  const isGuest = useMemo(() => {
    return !user || isLoading;
  }, [user, isLoading]);

  return (
    <BrowserRouter>
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
          <Route
            element={
              <ProtectedRoute
                isAuthenticated={isLoading || user?.role == "client"}
                redirectPath=""
              />
            }
          >
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/food-match" element={<FoodMatch />} />
          </Route>
          {/* Update to be in /user/updatePreference */}

          {/* Update to nested in /owner */}
          <Route
            element={
              <ProtectedRoute
                isAuthenticated={isLoading || user?.role == "owner"}
                redirectPath="/"
              />
            }
          >
            <Route
              path="/social-visibility"
              element={<SocialVisibilityDashboard />}
            />
            <Route path="/promotion" element={<PromotionManagement />} />
            <Route path="/promotion-form" element={<PromotionFormPage />} />

            <Route
              path="/promotion/edit/:promoId"
              element={<PromotionFormPage />}
            />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ContextNest>
      <RoutesCompiled />
    </ContextNest>
  );
}
