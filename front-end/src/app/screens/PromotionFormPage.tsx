import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { PromotionForm } from "../components/PromotionForm";
import type { Promotion } from "../types/promotion";
import { mockPromotions } from "../data/mockPromotions";
import { Loader2 } from "lucide-react";

export default function PromotionFormPage() {
  const { promoId } = useParams();
  const [promotion, setPromotion] = useState<Promotion | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(Boolean(promoId));

  useEffect(() => {
    if (!promoId) {
      setLoading(false);
      return;
    }

    const fetchPromotion = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("bitescouts_token");
        const response = await fetch(`http://localhost:8000/promotions/${promoId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPromotion(data);
        } else {
          // Fallback to mock data if API call returns 404 or fails
          const mockMatch = mockPromotions.find(
            (p) => p.promoId === promoId || p.id === promoId
          );
          setPromotion(mockMatch);
        }
      } catch (err) {
        console.error("Error fetching promotion for edit:", err);
        const mockMatch = mockPromotions.find(
          (p) => p.promoId === promoId || p.id === promoId
        );
        setPromotion(mockMatch);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [promoId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bs-neutral-100/60">
        <Loader2 className="animate-spin text-bs-gold mb-2" size={32} />
        <p className="text-sm font-medium text-bs-neutral-600">
          Loading promotion details...
        </p>
      </div>
    );
  }

  return <PromotionForm initialData={promotion} />;
}

