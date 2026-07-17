import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { type Sentiment } from "../../services/visibilityApi";

interface SentimentTabProps {
  sentiment: Sentiment;
  handleThemeClick: (theme: string) => Promise<void>;
}

export function SentimentTab({ sentiment, handleThemeClick }: SentimentTabProps) {
  const sentimentPieData = [
    {
      name: "Positive",
      value: sentiment.positivePct ?? 0,
      color: "#27AE60",
    },
    {
      name: "Negative",
      value: sentiment.negativePct ?? 0,
      color: "#FF4C4C",
    },
    { name: "Neutral", value: sentiment.neutralPct ?? 0, color: "#F59E0B" },
  ];

  const complaintThemeData = (sentiment.complaintThemes ?? []).map((c) => ({
    theme: c.theme,
    count: c.count ?? 0,
  }));

  return (
    <section aria-labelledby="sentiment-awareness">
      <h2 id="sentiment-awareness" className="mb-4">
        Customer Sentiment & Awareness
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Sentiment Widget */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <h3 className="mb-4">Review Sentiment</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  key="sentiment"
                  data={sentimentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentPieData.map((entry, index) => (
                    <Cell
                      key={`sentiment-cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-bs-green">
                {sentiment.positivePct ?? 0}%
              </div>
              <div className="text-sm text-bs-neutral-600">
                Positive
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-bs-red">
                {sentiment.negativePct ?? 0}%
              </div>
              <div className="text-sm text-bs-neutral-600">
                Negative
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#F59E0B]">
                {sentiment.neutralPct ?? 0}%
              </div>
              <div className="text-sm text-bs-neutral-600">
                Neutral
              </div>
            </div>
          </div>
        </div>

        {/* Top Complaint Themes */}
        <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
          <h3 className="mb-4">Top Complaint Themes</h3>
          <p className="text-xs text-bs-neutral-500 -mt-2 mb-2">
            Click a bar to see related Google Reviews
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complaintThemeData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E5E5"
              />
              <XAxis dataKey="theme" stroke="#737373" />
              <YAxis stroke="#737373" />
              <Tooltip />
              <Bar
                key="count"
                dataKey="count"
                fill="#FF4C4C"
                radius={[8, 8, 0, 0]}
                cursor="pointer"
                onClick={(event) => {
                  const ev: any = event;
                  const theme = ev.payload?.theme ?? ev.theme;
                  if (theme) handleThemeClick(theme);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          {complaintThemeData.length > 0 && (
            <div className="mt-4 text-sm text-bs-neutral-600">
              Most common issue:{" "}
              <span className="font-bold text-bs-red">
                {
                  [...complaintThemeData].sort(
                    (a, b) => b.count - a.count,
                  )[0].theme
                }{" "}
                (
                {
                  [...complaintThemeData].sort(
                    (a, b) => b.count - a.count,
                  )[0].count
                }{" "}
                mentions)
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
