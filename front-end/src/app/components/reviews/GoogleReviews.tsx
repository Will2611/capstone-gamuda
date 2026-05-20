import { Star, ExternalLink } from "lucide-react";

interface GoogleReviewsProps {
  averageRating: number;
  totalReviews: number;
  reviewUrl: string;
}

export function GoogleReviews({
  averageRating,
  totalReviews,
  reviewUrl,
}: GoogleReviewsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            className={
              star <= rating
                ? "fill-bs-gold text-bs-gold"
                : "text-bs-neutral-300"
            }
          />
        ))}
      </div>
    );
  };

  const handleOpenGoogle = () => {
    window.open(reviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating Display */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-bs-gold/10 rounded-full mb-4">
          <Star size={48} className="fill-bs-gold text-bs-gold" />
        </div>
        <div className="text-5xl font-bold text-bs-neutral-900 mb-3">
          {averageRating}
        </div>
        <div className="flex justify-center mb-2">
          {renderStars(Math.round(averageRating))}
        </div>
        <p className="text-bs-neutral-600">{totalReviews} reviews on Google</p>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleOpenGoogle}
        className="w-full py-3 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors flex items-center justify-center gap-2"
      >
        <ExternalLink size={20} />
        Read More on Google
      </button>

      <p className="text-xs text-center text-bs-neutral-500 italic">
        Click to view full reviews on Google
      </p>
    </div>
  );
}
