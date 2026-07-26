import { FunnelChart } from "./FunnelChart";
import { type FunnelStage } from "../../services/visibilityApi";

interface FunnelTabProps {
  funnel: FunnelStage[];
}

export function FunnelTab({ funnel }: FunnelTabProps) {
  return (
    <section aria-labelledby="traffic-funnel">
      <h2 id="traffic-funnel" className="mb-2">
        Traffic & Conversion Funnel
      </h2>
      <p className="text-sm text-bs-neutral-600 mb-4">
        See where diners drop off between seeing your restaurant and getting
        directions.
      </p>
      <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 mt-2">
        <h3 className="mb-4">Conversion Funnel</h3>
        <FunnelChart
          stages={funnel.filter(
            (s) => s.name !== "Visits" && s.name !== "Reviews",
          )}
        />
      </div>
    </section>
  );
}
