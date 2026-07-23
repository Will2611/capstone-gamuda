import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { PlanProgressIndicator } from "./PlanProgressIndicator";

export function WaitingForPartnerCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2 my-2 rounded-2xl border border-bs-gold/30 bg-gradient-to-br from-bs-gold/10 to-white p-4 shadow-sm"
    >
      <PlanProgressIndicator status="waiting_partner" />
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-bs-gold animate-spin" />
        <div>
          <p className="font-semibold text-bs-neutral-900">
            Waiting for your match
          </p>
          <p className="text-sm text-bs-neutral-600">
            Waiting for your match to submit their availability.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
