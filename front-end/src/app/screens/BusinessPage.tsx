import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { BarChart3, Megaphone, TrendingUp, Mail, Phone } from 'lucide-react';

export function BusinessPage() {
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const businessModels = [
    {
      icon: <BarChart3 size={48} />,
      title: 'Subscription Dashboard',
      description: 'Access to analytics, customer insights, and performance metrics',
      price: '$99/month',
      features: [
        'Real-time visibility score',
        'Customer preference analytics',
        'Conversion tracking',
        'Weekly performance reports',
      ],
    },
    {
      icon: <Megaphone size={48} />,
      title: 'Promoted Listings',
      description: 'Boost your restaurant to the top of search results',
      price: '$199/month',
      features: [
        'Priority placement in search',
        'Featured "Top Match" status',
        'Custom promotional banners',
        'A/B testing for listings',
      ],
    },
    {
      icon: <TrendingUp size={48} />,
      title: 'Pay-per-Conversion',
      description: 'Only pay when customers visit after a BiteScouts recommendation',
      price: '$5 per visit',
      features: [
        'No upfront costs',
        'Verified visit tracking',
        'Detailed attribution reports',
        'Volume discounts available',
      ],
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-bs-neutral-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-bs-gold/20 to-bs-blue/20 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="mb-4">Grow Your Restaurant with BiteScouts</h1>
          <p className="text-xl text-bs-neutral-700 mb-8 max-w-3xl mx-auto">
            Connect with diners who are actively looking for exactly what you offer.
            Turn searches into visits with AI-powered matching.
          </p>
          <div className="inline-block bg-bs-gold text-bs-neutral-900 px-6 py-3 rounded-lg shadow-lg">
            <p className="font-bold">Join our Pilot Program - 3 months free</p>
          </div>
        </div>
      </div>

      {/* Business Models */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-center mb-12">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {businessModels.map((model, index) => (
            <Card key={index} hover className="flex flex-col">
              <div className="text-bs-gold mb-4">{model.icon}</div>
              <h3 className="mb-2">{model.title}</h3>
              <p className="text-bs-neutral-600 mb-4 flex-grow">{model.description}</p>
              <div className="mb-4">
                <span className="text-2xl font-bold text-bs-neutral-900">{model.price}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {model.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-bs-neutral-700">
                    <svg className="w-5 h-5 text-bs-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-auto">
                Get Started
              </Button>
            </Card>
          ))}
        </div>

        {/* Pilot Program CTA */}
        <Card className="bg-gradient-to-br from-bs-blue/10 to-bs-green/10 border-2 border-bs-blue">
          <div className="text-center py-8">
            <h2 className="mb-4">Join Our Pilot Program</h2>
            <p className="text-lg text-bs-neutral-700 mb-8 max-w-2xl mx-auto">
              Be among the first restaurants to leverage AI-powered customer matching.
              Get 3 months of any plan completely free, plus dedicated onboarding support.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                <FormField
                  type="text"
                  placeholder="Your Restaurant Name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
                <FormField
                  type="email"
                  placeholder="Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">
                  Join Pilot Program - 3 Months Free
                </Button>
              </form>
            ) : (
              <div className="bg-bs-green/20 text-bs-green p-6 rounded-lg max-w-md mx-auto">
                <h3 className="mb-2">Thank You!</h3>
                <p>We'll be in touch within 24 hours to get you started.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <h2 className="mb-8">Questions? We're Here to Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card hover>
              <div className="flex items-center gap-4">
                <div className="bg-bs-blue/20 p-3 rounded-lg">
                  <Mail className="text-bs-blue" size={24} />
                </div>
                <div className="text-left">
                  <h4 className="mb-1">Email Us</h4>
                  <p className="text-sm text-bs-neutral-600">partners@bitescouts.com</p>
                </div>
              </div>
            </Card>
            <Card hover>
              <div className="flex items-center gap-4">
                <div className="bg-bs-blue/20 p-3 rounded-lg">
                  <Phone className="text-bs-blue" size={24} />
                </div>
                <div className="text-left">
                  <h4 className="mb-1">Call Us</h4>
                  <p className="text-sm text-bs-neutral-600">1-800-BITE-SCOUT</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
