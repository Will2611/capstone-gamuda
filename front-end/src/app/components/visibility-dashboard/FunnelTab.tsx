import { AlertCircle } from "lucide-react";
import { FunnelChart } from "./FunnelChart";
import { type FunnelStage } from "../../services/visibilityApi";

interface FunnelTabProps {
  funnel: FunnelStage[];
  dropOffStage: FunnelStage | undefined;
}

export function FunnelTab({ funnel, dropOffStage }: FunnelTabProps) {
  return (
    <section aria-labelledby="traffic-funnel">
      <h2 id="traffic-funnel" className="mb-4">
        Traffic & Conversion Funnel
      </h2>
      <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 mt-4">
        <h3 className="mb-4">Conversion Funnel</h3>
        <FunnelChart
          stages={funnel.filter(
            (s) => s.name !== "Visits" && s.name !== "Reviews",
          )}
        />

        {/* {dropOffStage && ( REMOVE THIS COMMENTED CODE AS IT IS NOT NEEDED
          <div className="mt-4 p-3 bg-bs-red/5 border border-bs-red/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-bs-neutral-900">
              <AlertCircle size={16} className="text-bs-red" />
              <span className="font-medium">Drop-off detected:</span>
              <span>
                {dropOffStage.name} conversion is{" "}
                {dropOffStage.conversion ?? 0}% below average
              </span>
            </div>
          </div>
        )} */}
      </div>
    </section>
  );
}
