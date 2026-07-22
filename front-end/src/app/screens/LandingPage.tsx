import { ImageSlideshow } from "../components/ImageSlideshow";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import MapBannerSVG from "@/assets/map-banner.svg?react";
import heroFoodBg1 from "@/assets/hero-food-bg.png";
import heroFoodBg2 from "@/assets/hero-food-bg-2.png";
import heroFoodBg3 from "@/assets/hero-food-bg-3.png";
import { Clock4, MapPin, CalendarRange } from "lucide-react";
// import { FoodEmojiRain } from "../components/landing/FoodEmojiRain";

const HERO_IMAGES = [heroFoodBg1, heroFoodBg2, heroFoodBg3];

const malaysianFoodImages = [
  "/src/assets/images/malaysian-food-1.jpg",
  "/src/assets/images/malaysian-food-2.jpg",
  "/src/assets/images/malaysian-food-3.jpg",
  "/src/assets/images/malaysian-food-4.jpg",
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 6000); // changes image every 6 seconds
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: (
        <Clock4
          size={48}
          stroke="#FFD700"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
      title: "Personalized Picks",
      description:
        "AI-powered recommendations based on your tastes and preferences",
    },
    {
      icon: <MapPin size={48} stroke="#ff4c4c" strokeWidth={1.5} />,
      title: "One-Tap Directions",
      description: "Instant navigation to your perfect dining destination",
    },
    {
      icon: <CalendarRange size={48} stroke="#2D9CDB" strokeWidth={1.5} />,
      title: "Business Insights",
      description: "Restaurant owners get actionable data and recommendations",
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Animated Food Emoji Background Rain */}
      {/* <FoodEmojiRain /> */}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-bs-gold/20 via-bs-red/10 to-bs-blue/20 overflow-hidden">
        {/* Add the Slideshow here */}
        <ImageSlideshow images={malaysianFoodImages} interval={4000} />
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <MapBannerSVG />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32 text-center">
          <h1 className="mb-6 text-white drop-shadow-lg">
            Match tastes to tables fast
          </h1>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Discover the perfect restaurant for your cravings with AI-powered
            recommendations
          </p>
          <Button onClick={() => navigate("/map")}>Find Restaurant</Button>
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
      <div className="bg-white/40 border-t border-white/25 backdrop-blur-xs py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="mb-4">Ready to find your perfect meal?</h2>
          <p className="text-lg text-bs-neutral-700 mb-8">
            Join thousands of food lovers discovering their new favorite spots
          </p>
          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/map")}>Find Restaurant</Button>
            <Button variant="secondary" onClick={() => navigate("/search")}>
              Set Preferences
            </Button>
            <Button variant="secondary" onClick={() => navigate("/business")}>
              I'm a Restaurant Owner
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
