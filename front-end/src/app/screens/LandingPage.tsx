import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="#FFD700" strokeWidth="3"/>
          <path d="M24 14V24L30 30" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Personalized Picks',
      description: 'AI-powered recommendations based on your tastes and preferences',
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4C13 4 4 13 4 24C4 35 24 44 24 44C24 44 44 35 44 24C44 13 35 4 24 4Z" stroke="#FF4C4C" strokeWidth="3"/>
          <circle cx="24" cy="24" r="6" fill="#FF4C4C"/>
        </svg>
      ),
      title: 'One-Tap Directions',
      description: 'Instant navigation to your perfect dining destination',
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="10" width="36" height="28" rx="4" stroke="#2D9CDB" strokeWidth="3"/>
          <path d="M6 18H42M16 10V6M32 10V6M18 26H22M26 26H30M18 32H22M26 32H30" stroke="#2D9CDB" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      ),
      title: 'Business Insights',
      description: 'Restaurant owners get actionable data and recommendations',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-bs-gold/20 via-bs-red/10 to-bs-blue/20 overflow-hidden">
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="map-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <line x1="0" y1="50" x2="100" y2="50" stroke="#666" strokeWidth="1"/>
                <line x1="50" y1="0" x2="50" y2="100" stroke="#666" strokeWidth="1"/>
                <circle cx="25" cy="25" r="4" fill="#FFD700"/>
                <circle cx="75" cy="75" r="4" fill="#FF4C4C"/>
                <circle cx="60" cy="30" r="4" fill="#FFD700"/>
                <circle cx="30" cy="70" r="4" fill="#FF4C4C"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-pattern)"/>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32 text-center">
          <h1 className="mb-6 text-bs-neutral-900">Match tastes to tables fast</h1>
          <p className="text-xl text-bs-neutral-700 mb-8 max-w-2xl mx-auto">
            Discover the perfect restaurant for your cravings with AI-powered recommendations
          </p>
          <Button onClick={() => navigate('/search')}>
            Start Your Search
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} hover>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="mb-3">{feature.title}</h3>
                <p className="text-bs-neutral-600">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-bs-neutral-100 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="mb-4">Ready to find your perfect meal?</h2>
          <p className="text-lg text-bs-neutral-700 mb-8">
            Join thousands of food lovers discovering their new favorite spots
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/search')}>
              Start Searching
            </Button>
            <Button variant="secondary" onClick={() => navigate('/business')}>
              I'm a Restaurant Owner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
