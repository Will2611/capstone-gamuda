import { Megaphone } from "lucide-react";
import { useNavigate } from "react-router";

export function PromotionsTab() {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="promotion-suggestions">
      <h2 id="promotion-suggestions" className="mb-4">
        Promotion Suggestions
      </h2>
      <div className="space-y-6">
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
