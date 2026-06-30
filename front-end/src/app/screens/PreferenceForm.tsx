import { useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { SelectField } from "../components/FormField";
import { useUser } from "../context/UserContext";
import type { SearchPreferences } from "../types/restaurant";
import {
  Utensils,
  DollarSign,
  Leaf,
  MapPin,
  Coffee,
  Clock,
} from "lucide-react";

const emptyForm: SearchPreferences = {
  cuisine: "",
  priceRange: "",
  dietary: "",
  distance: "",
  ambience: "",
  time: "",
};

export default function PreferenceForm() {
  const navigate = useNavigate();
  const { updatePreferences, addSearchHistory } = useUser();
  const [formData, setFormData] = useState<SearchPreferences>(emptyForm);

  const saveAndGoToMap = (prefs: SearchPreferences) => {
    const hasAny = Object.values(prefs).some(Boolean);
    if (hasAny) {
      updatePreferences(prefs);
      const labels = [prefs.cuisine, prefs.dietary, prefs.ambience].filter(
        Boolean,
      );
      addSearchHistory({
        query: labels.length
          ? `Search: ${labels.join(", ")}`
          : "Restaurant search",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        preferences: prefs,
      });
    }
    navigate("/map");
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveAndGoToMap(formData);
  };

  const handleFindRestaurant = () => {
    saveAndGoToMap(formData);
  };

  return (
    <div className="min-h-screen bg-bs-neutral-100 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h1 className="mb-2 text-center">Find Your Perfect Match</h1>
          <p className="text-bs-neutral-600 text-center mb-8">
            Tell us what you&apos;re craving -- or skip straight to the map
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <SelectField
              label="Cuisine"
              icon={<Utensils size={20} />}
              options={[
                { value: "", label: "Select cuisine type..." },
                { value: "italian", label: "Italian" },
                { value: "mexican", label: "Mexican" },
                { value: "asian", label: "Asian" },
                { value: "american", label: "American" },
                { value: "mediterranean", label: "Mediterranean" },
                { value: "indian", label: "Indian" },
              ]}
              value={formData.cuisine}
              onChange={(e) =>
                setFormData({ ...formData, cuisine: e.target.value })
              }
            />

            <SelectField
              label="Price Range"
              icon={<DollarSign size={20} />}
              options={[
                { value: "", label: "Select price range..." },
                { value: "1", label: "$ - Budget-friendly" },
                { value: "2", label: "$$ - Moderate" },
                { value: "3", label: "$$$ - Upscale" },
                { value: "4", label: "$$$$ - Fine Dining" },
              ]}
              value={formData.priceRange}
              onChange={(e) =>
                setFormData({ ...formData, priceRange: e.target.value })
              }
            />

            <SelectField
              label="Dietary Needs"
              icon={<Leaf size={20} />}
              options={[
                { value: "", label: "Select dietary preferences..." },
                { value: "none", label: "No restrictions" },
                { value: "vegetarian", label: "Vegetarian" },
                { value: "vegan", label: "Vegan" },
                { value: "gluten-free", label: "Gluten-Free" },
                { value: "halal", label: "Halal" },
                { value: "kosher", label: "Kosher" },
              ]}
              value={formData.dietary}
              onChange={(e) =>
                setFormData({ ...formData, dietary: e.target.value })
              }
            />

            <SelectField
              label="Max Travel Distance"
              icon={<MapPin size={20} />}
              options={[
                { value: "", label: "Select max distance..." },
                { value: "1", label: "Within 1 mile" },
                { value: "3", label: "Within 3 miles" },
                { value: "5", label: "Within 5 miles" },
                { value: "10", label: "Within 10 miles" },
                { value: "20", label: "Within 20 miles" },
              ]}
              value={formData.distance}
              onChange={(e) =>
                setFormData({ ...formData, distance: e.target.value })
              }
            />

            <SelectField
              label="Ambience"
              icon={<Coffee size={20} />}
              options={[
                { value: "", label: "Select ambience..." },
                { value: "casual", label: "Casual" },
                { value: "romantic", label: "Romantic" },
                { value: "family", label: "Family-friendly" },
                { value: "business", label: "Business" },
                { value: "trendy", label: "Trendy" },
                { value: "quiet", label: "Quiet" },
              ]}
              value={formData.ambience}
              onChange={(e) =>
                setFormData({ ...formData, ambience: e.target.value })
              }
            />

            <SelectField
              label="Time of Visit"
              icon={<Clock size={20} />}
              options={[
                { value: "", label: "Select time..." },
                { value: "breakfast", label: "Breakfast (6-11 AM)" },
                { value: "lunch", label: "Lunch (11 AM-3 PM)" },
                { value: "dinner", label: "Dinner (5-10 PM)" },
                { value: "late-night", label: "Late Night (10 PM+)" },
              ]}
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />

            <div className="pt-4 space-y-3">
              <Button
                type="button"
                className="w-full"
                onClick={handleFindRestaurant}
              >
                Find Restaurant
              </Button>
              <p className="text-center text-xs text-bs-neutral-500">
                Goes straight to the map -- preferences are optional
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
