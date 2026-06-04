import { useNavigate } from "react-router";
import { SuggestionCard } from "../components/Card";
import { Button } from "../components/Button";

export default function SuggestionsPage() {
  const navigate = useNavigate();

  const suggestions = [
    {
      id: 1,
      summary:
        "Highly rated for spicy noodles; 10-15 min drive; vegetarian options available",
      rating: 4.8,
      distance: "10-15 min",
      dietary: "Vegetarian options",
    },
    {
      id: 2,
      summary:
        "Perfect for authentic Italian pasta; 12-18 min drive; gluten-free menu available",
      rating: 4.5,
      distance: "12-18 min",
      dietary: "Gluten-free options",
    },
    {
      id: 3,
      summary:
        "Fresh Mexican cuisine with vegan choices; 8-12 min drive; lively atmosphere",
      rating: 4.6,
      distance: "8-12 min",
      dietary: "Vegan options",
    },
    {
      id: 4,
      summary:
        "Premium sushi experience; 15-20 min drive; gluten-free soy sauce available",
      rating: 4.7,
      distance: "15-20 min",
      dietary: "Gluten-free options",
    },
    {
      id: 5,
      summary:
        "Classic American comfort food; 5-8 min drive; vegetarian burgers available",
      rating: 4.4,
      distance: "5-8 min",
      dietary: "Vegetarian options",
    },
    {
      id: 6,
      summary:
        "Mediterranean flavors with healthy options; 18-22 min drive; fully vegan menu",
      rating: 4.6,
      distance: "18-22 min",
      dietary: "Vegan options",
    },
  ];

  return (
    <div className="min-h-screen bg-bs-neutral-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="mb-2">Your Personalized Recommendations</h1>
          <p className="text-bs-neutral-600">
            Based on your preferences, here are the best dining options for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              summary={suggestion.summary}
              rating={suggestion.rating}
              distance={suggestion.distance}
              dietary={suggestion.dietary}
              onViewMap={() => navigate("/map")}
            />
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate("/map")}>View on Map</Button>
          <Button variant="secondary" onClick={() => navigate("/search")}>
            New Search
          </Button>
        </div>
      </div>
    </div>
  );
}
