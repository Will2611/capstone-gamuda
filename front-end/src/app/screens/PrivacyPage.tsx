import { Card } from "../components/Card";
import {
  Shield,
  Lock,
  CheckCircle,
  Eye,
  Database,
  UserCheck,
} from "lucide-react";

export default function PrivacyPage() {
  const privacyFeatures = [
    {
      icon: <Shield size={20} />,
      text: "All consumer data is anonymized and aggregated",
    },
    {
      icon: <Lock size={20} />,
      text: "Encrypted data transmission and storage",
    },
    {
      icon: <UserCheck size={20} />,
      text: "Opt-in consent required for all data collection",
    },
    {
      icon: <Eye size={20} />,
      text: "No personally identifiable information (PII) shared with restaurants",
    },
    {
      icon: <Database size={20} />,
      text: "GDPR and CCPA compliant data handling",
    },
    {
      icon: <CheckCircle size={20} />,
      text: "You control your data - delete anytime",
    },
  ];

  return (
    <div className="min-h-screen bg-bs-neutral-100 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-bs-blue/20 rounded-full mb-6">
            <Shield className="text-bs-blue" size={48} />
          </div>
          <h1 className="mb-4">Your Privacy is Our Priority</h1>
          <p className="text-lg text-bs-neutral-600 max-w-2xl mx-auto">
            We believe in transparent data practices. Here's how we protect your
            information and respect your privacy.
          </p>
        </div>

        {/* Privacy Guarantees */}
        <Card className="mb-8">
          <h2 className="mb-6">Our Privacy Guarantees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {privacyFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-bs-green/10 rounded-lg"
              >
                <div className="text-bs-green mt-1">{feature.icon}</div>
                <p className="text-bs-neutral-700">{feature.text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* How It Works */}
        <Card className="mb-8">
          <h2 className="mb-6">How Your Data is Used</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2">What We Collect</h3>
              <p className="text-bs-neutral-600">
                We collect your dining preferences (cuisine, price range,
                dietary needs, etc.) and location data to provide personalized
                restaurant recommendations.
              </p>
            </div>
            <div>
              <h3 className="mb-2">How We Use It</h3>
              <p className="text-bs-neutral-600">
                Your preferences are used to match you with restaurants. We
                aggregate anonymous data to help restaurants understand market
                trends (e.g., "30% of users in this area prefer vegetarian
                options").
              </p>
            </div>
            <div>
              <h3 className="mb-2">What We Don't Share</h3>
              <p className="text-bs-neutral-600">
                We never share your name, contact information, or individual
                search history with restaurants. All data shared is aggregated
                and anonymized.
              </p>
            </div>
          </div>
        </Card>

        {/* Data Controls */}
        <Card className="mb-8">
          <h2 className="mb-6">Your Data Controls</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border border-bs-neutral-200 rounded-lg">
              <Eye className="text-bs-blue mt-1" size={24} />
              <div>
                <h4 className="mb-1">View Your Data</h4>
                <p className="text-sm text-bs-neutral-600">
                  Request a copy of all data we have about you at any time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-bs-neutral-200 rounded-lg">
              <Lock className="text-bs-blue mt-1" size={24} />
              <div>
                <h4 className="mb-1">Opt Out of Analytics</h4>
                <p className="text-sm text-bs-neutral-600">
                  Choose to exclude your data from aggregated analytics shared
                  with restaurants
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-bs-neutral-200 rounded-lg">
              <Database className="text-bs-blue mt-1" size={24} />
              <div>
                <h4 className="mb-1">Delete Your Data</h4>
                <p className="text-sm text-bs-neutral-600">
                  Request complete deletion of your account and all associated
                  data
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 text-center border border-bs-green">
            <CheckCircle className="text-bs-green mx-auto mb-3" size={32} />
            <h4 className="mb-2">GDPR Compliant</h4>
            <p className="text-sm text-bs-neutral-600">
              Full compliance with European data protection standards
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center border border-bs-green">
            <CheckCircle className="text-bs-green mx-auto mb-3" size={32} />
            <h4 className="mb-2">CCPA Compliant</h4>
            <p className="text-sm text-bs-neutral-600">
              California Consumer Privacy Act certified
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center border border-bs-green">
            <CheckCircle className="text-bs-green mx-auto mb-3" size={32} />
            <h4 className="mb-2">SOC 2 Certified</h4>
            <p className="text-sm text-bs-neutral-600">
              Industry-standard security practices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
