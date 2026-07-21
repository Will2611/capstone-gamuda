import { Star, TrendingUp, MessageSquare, Megaphone } from "lucide-react";
import { useNavigate } from "react-router";

interface PromotionsTabProps {
  handleQuickFix: (action: string) => void;
}

export function PromotionsTab({ handleQuickFix }: PromotionsTabProps) {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="promotion-suggestions">
      <h2 id="promotion-suggestions" className="mb-4">
        Promotion Suggestions
      </h2>
      <div className="space-y-6">
        {/* Promotion Management */}
        <div className="bg-gradient-to-br from-bs-green/10 to-bs-green/5 border-2 border-bs-green rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-bs-green/20 rounded-lg text-bs-green shrink-0">
              <Megaphone className="text-bs-green" size={22} />
            </div>
            <h3 className="font-bold text-bs-neutral-900 text-lg">
              Promotion Management
            </h3>
          </div>
          <p className="text-sm text-bs-neutral-700">
            Create, edit and manage your restaurant promotions. Set up new
            deals, schedule campaigns, and track active discounts.
          </p>
          <div>
            <button
              onClick={() => navigate("/promotion")}
              className="w-full py-2.5 bg-bs-green text-bs-neutral-900 rounded-lg hover:brightness-110 transition-colors font-bold text-sm shadow-sm"
            >
              Manage Promotions
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
const obsolete = ({ handleQuickFix }: PromotionsTabProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Family Dinner Friday */}
    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-bs-gold/10 to-bs-gold/5 border-2 border-bs-gold rounded-lg p-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="text-bs-gold" size={20} />
          <h3 className="font-bold text-bs-neutral-900">
            Family Dinner Friday
          </h3>
        </div>
        <p className="text-sm text-bs-neutral-700 mb-4">
          Offer a 10% discount for families at 8 PM so that you can eat with
          your loved ones.
        </p>
      </div>
      <button
        onClick={() => handleQuickFix("post-instagram")}
        className="w-full py-2 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors font-medium text-sm"
      >
        Post on Instagram
      </button>
    </div>

    {/* Spicy Noodles Trend */}
    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-bs-red/10 to-bs-red/5 border-2 border-bs-red rounded-lg p-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-bs-red" size={20} />
          <h3 className="font-bold text-bs-neutral-900">Spicy Noodles Trend</h3>
        </div>
        <p className="text-sm text-bs-neutral-700 mb-4">
          Add "Spicy Noodles" to your menu description to match trending
          searches.
        </p>
      </div>
      <button
        onClick={() => handleQuickFix("update-keywords")}
        className="w-full py-2 bg-bs-red text-bs-neutral-900 rounded-lg hover:bg-bs-red/90 transition-colors font-medium text-sm"
      >
        Update Keywords
      </button>
    </div>

    {/* TikTok Challenge */}
    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-bs-blue/10 to-bs-blue/5 border-2 border-bs-blue rounded-lg p-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="text-bs-blue" size={20} />
          <h3 className="font-bold text-bs-neutral-900">TikTok Challenge</h3>
        </div>
        <p className="text-sm text-bs-neutral-700 mb-4">
          Encourage customers to post short clips with #QuickLunchChallenge.
        </p>
      </div>
      <button className="w-full py-2 bg-bs-blue text-bs-neutral-900 rounded-lg hover:bg-bs-blue/90 transition-colors font-medium text-sm">
        View Example Posts
      </button>
    </div>
  </div>
);
