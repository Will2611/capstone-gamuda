import type { Restaurant } from "../types/restaurant";

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 1,
    name: "Spice Haven",
    rating: 4.8,
    distance: "10-15 min",
    dietary: "Vegetarian options",
    cuisine: "Asian",
    isOpen: true,
    type: "gold",
    position: { top: "45%", left: "55%" },
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    name: "Pasta Paradise",
    rating: 4.5,
    distance: "12-18 min",
    dietary: "Gluten-free options",
    cuisine: "Italian",
    isOpen: true,
    type: "red",
    position: { top: "30%", left: "40%" },
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Taco Fiesta",
    rating: 4.6,
    distance: "8-12 min",
    dietary: "Vegan options",
    cuisine: "Mexican",
    isOpen: false,
    type: "red",
    position: { top: "60%", left: "35%" },
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
  },
  {
    id: 4,
    name: "Sushi Supreme",
    rating: 4.7,
    distance: "15-20 min",
    dietary: "Gluten-free options",
    cuisine: "Japanese",
    isOpen: true,
    type: "red",
    position: { top: "25%", left: "65%" },
    image:
      "https://images.unsplash.com/photo-1579584425555-c3ce17fd1871?w=400&h=300&fit=crop",
  },
];
