import { useParams } from "react-router";
import { PromotionForm } from "../components/PromotionForm";
import { mockPromotions } from "../data/mockPromotions";

export default function PromotionFormPage() {
  const { promoId } = useParams();

  const promotion = mockPromotions.find((p) => p.promoId === promoId);

  return <PromotionForm initialData={promotion} />;
}
