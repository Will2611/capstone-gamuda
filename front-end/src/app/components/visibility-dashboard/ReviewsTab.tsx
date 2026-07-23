import { Star } from "lucide-react";
import { SocialMediaCard } from "./SocialMediaCard";
import { type SocialPlatformCard } from "../../services/visibilityApi";

interface ReviewsTabProps {
  social: SocialPlatformCard[];
}

export function ReviewsTab({ social }: ReviewsTabProps) {
  return (
    <section aria-labelledby="social-visibility">
      <h2 id="social-visibility" className="mb-4">
        Google Review Visibility
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {social
          .filter((p) => p.platform === "Google Reviews")
          .map((p) => (
            <SocialMediaCard
              key={p.platform}
              platform={p.platform}
              icon={<Star size={24} />}
              metrics={p.metrics}
              ctaLabel={`Open ${p.platform}`}
              url={p.url}
              color="text-bs-gold"
              hideOpenButton={true}
            />
          ))}
      </div>
    </section>
  );
}
