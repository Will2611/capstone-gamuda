import { BrowserRouter, Routes, Route } from 'react-router';
import { Navigation } from './components/Navigation';
import { LandingPage } from './screens/LandingPage';
import { PreferenceForm } from './screens/PreferenceForm';
import { MapInterface } from './screens/MapInterface';
import { SuggestionsPage } from './screens/SuggestionsPage';
import { OwnerDashboard } from './screens/OwnerDashboard';
import { PrivacyPage } from './screens/PrivacyPage';
import { BusinessPage } from './screens/BusinessPage';

export default function App() {
  return (
    <BrowserRouter>
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}