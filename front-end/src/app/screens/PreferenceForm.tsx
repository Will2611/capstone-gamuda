import { useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { SelectField } from "../components/FormField";
import { MultiSelectField } from "../components/MultiSelectField";
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
  cuisine: [],
  priceRange: [],
  dietary: [],
  distance: "",
  ambience: [],
  time: "",
};

export default function PreferenceForm() {
  const navigate = useNavigate();
  const { updatePreferences, addSearchHistory } = useUser();
  const [formData, setFormData] = useState<SearchPreferences>(emptyForm);

  const saveAndGoToMap = (prefs: SearchPreferences) => {
    const hasAny = Object.values(prefs).some((val) =>
      Array.isArray(val) ? val.length > 0 : Boolean(val),
    );

    if (hasAny) {
      updatePreferences(prefs);
      const labels: string[] = [];
      if (prefs.cuisine.length) labels.push(...prefs.cuisine);
      if (prefs.dietary.length) labels.push(...prefs.dietary);
      if (prefs.ambience.length) labels.push(...prefs.ambience);

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
            Tell us what you&apos;re craving — or skip straight to the map
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <MultiSelectField
              label="Cuisine"
              icon={<Utensils size={20} />}
              options={[
                { value: "italian", label: "Italian" },
                { value: "mexican", label: "Mexican" },
                { value: "asian", label: "Asian" },
                { value: "american", label: "American" },
                { value: "mediterranean", label: "Mediterranean" },
                { value: "indian", label: "Indian" },
              ]}
              value={formData.cuisine}
              onChange={(val) => setFormData({ ...formData, cuisine: val })}
              placeholder="Select cuisine types..."
            />

            <MultiSelectField
              label="Price Range"
              icon={<DollarSign size={20} />}
              options={[
                { value: "", label: "Any Price" },
                { value: "1", label: "$ < RM20 / person" },
                { value: "2", label: "$$ RM20 - RM60 / person" },
                { value: "3", label: "$$$ RM60 - RM110 / person" },
                { value: "4", label: "$$$$ RM110 - RM250 / person" },
                { value: "5", label: "$$$$$ > RM250 / person" },
              ]}
              value={formData.priceRange}
              onChange={(val) => setFormData({ ...formData, priceRange: val })}
              placeholder="Select price ranges..."
            />

            <MultiSelectField
              label="Dietary Needs"
              icon={<Leaf size={20} />}
              options={[
                { value: "none", label: "No restrictions" },
                { value: "vegetarian", label: "Vegetarian" },
                { value: "vegan", label: "Vegan" },
                { value: "gluten-free", label: "Gluten-Free" },
                { value: "halal", label: "Halal" },
                { value: "kosher", label: "Kosher" },
              ]}
              value={formData.dietary}
              onChange={(val) => setFormData({ ...formData, dietary: val })}
              placeholder="Select dietary preferences..."
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

            <MultiSelectField
              label="Ambience"
              icon={<Coffee size={20} />}
              options={[
                { value: "casual", label: "Casual" },
                { value: "finedining", label: "Fine Dining" },
                { value: "romantic", label: "Romantic" },
                { value: "family", label: "Family" },
                { value: "business", label: "Business" },
                { value: "trendy", label: "Trendy" },
                { value: "quiet", label: "Quiet" },
                { value: "cozy", label: "Cozy" },
                { value: "lively", label: "Lively" },
              ]}
              value={formData.ambience}
              onChange={(val) => setFormData({ ...formData, ambience: val })}
              placeholder="Select ambiences..."
            />

            <SelectField
              label="Time of Visit"
              icon={<Clock size={20} />}
              options={[
                { value: "", label: "Select time..." },
                { value: "breakfast (6-11 AM)", label: "Breakfast (6-11 AM)" },
                { value: "lunch (11 AM-3 PM)", label: "Lunch (11 AM-3 PM)" },
                { value: "dinner (5-10 PM)", label: "Dinner (5-10 PM)" },
                { value: "late-night (10 PM+)", label: "Late Night (10 PM+)" },
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
                Goes straight to the map — preferences are optional
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
