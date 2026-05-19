import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { FormField, SelectField } from '../components/FormField';
import { Utensils, DollarSign, Leaf, MapPin, Coffee, Clock } from 'lucide-react';

export function PreferenceForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cuisine: '',
    priceRange: '',
    dietary: '',
    distance: '',
    ambience: '',
    time: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/map', { state: formData });
  };

  return (
    <div className="min-h-screen bg-bs-neutral-100 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h1 className="mb-2 text-center">Find Your Perfect Match</h1>
          <p className="text-bs-neutral-600 text-center mb-8">
            Tell us what you're craving and we'll find the best spots for you
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <SelectField
              label="Cuisine"
              icon={<Utensils size={20} />}
              options={[
                { value: '', label: 'Select cuisine type...' },
                { value: 'italian', label: 'Italian' },
                { value: 'mexican', label: 'Mexican' },
                { value: 'asian', label: 'Asian' },
                { value: 'american', label: 'American' },
                { value: 'mediterranean', label: 'Mediterranean' },
                { value: 'indian', label: 'Indian' },
              ]}
              value={formData.cuisine}
              onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
              required
            />

            <SelectField
              label="Price Range"
              icon={<DollarSign size={20} />}
              options={[
                { value: '', label: 'Select price range...' },
                { value: '1', label: '$ - Budget-friendly' },
                { value: '2', label: '$$ - Moderate' },
                { value: '3', label: '$$$ - Upscale' },
                { value: '4', label: '$$$$ - Fine Dining' },
              ]}
              value={formData.priceRange}
              onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
              required
            />

            <SelectField
              label="Dietary Needs"
              icon={<Leaf size={20} />}
              options={[
                { value: '', label: 'Select dietary preferences...' },
                { value: 'none', label: 'No restrictions' },
                { value: 'vegetarian', label: 'Vegetarian' },
                { value: 'vegan', label: 'Vegan' },
                { value: 'gluten-free', label: 'Gluten-Free' },
                { value: 'halal', label: 'Halal' },
                { value: 'kosher', label: 'Kosher' },
              ]}
              value={formData.dietary}
              onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
              required
            />

            <SelectField
              label="Max Travel Distance"
              icon={<MapPin size={20} />}
              options={[
                { value: '', label: 'Select max distance...' },
                { value: '1', label: 'Within 1 mile' },
                { value: '3', label: 'Within 3 miles' },
                { value: '5', label: 'Within 5 miles' },
                { value: '10', label: 'Within 10 miles' },
                { value: '20', label: 'Within 20 miles' },
              ]}
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              required
            />

            <SelectField
              label="Ambience"
              icon={<Coffee size={20} />}
              options={[
                { value: '', label: 'Select ambience...' },
                { value: 'casual', label: 'Casual' },
                { value: 'romantic', label: 'Romantic' },
                { value: 'family', label: 'Family-friendly' },
                { value: 'business', label: 'Business' },
                { value: 'trendy', label: 'Trendy' },
                { value: 'quiet', label: 'Quiet' },
              ]}
              value={formData.ambience}
              onChange={(e) => setFormData({ ...formData, ambience: e.target.value })}
              required
            />

            <SelectField
              label="Time of Visit"
              icon={<Clock size={20} />}
              options={[
                { value: '', label: 'Select time...' },
                { value: 'breakfast', label: 'Breakfast (6-11 AM)' },
                { value: 'lunch', label: 'Lunch (11 AM-3 PM)' },
                { value: 'dinner', label: 'Dinner (5-10 PM)' },
                { value: 'late-night', label: 'Late Night (10 PM+)' },
              ]}
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />

            <div className="pt-4">
              <Button type="submit" className="w-full">
                Find My Match
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
