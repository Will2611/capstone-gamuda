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
import {
  type Sentiment,
  type ThemeSentimentType,
} from "../../services/visibilityApi";

interface SentimentTabProps {
  sentiment: Sentiment;
  handleThemeClick: (
    theme: string,
    sentimentType?: ThemeSentimentType,
  ) => Promise<void>;
}

function topTheme(data: { theme: string; count: number }[]) {
  if (!data.length) return null;
  return [...data].sort((a, b) => b.count - a.count)[0];
}

function ThemeBarCard({
  title,
  subtitle,
  emptyLabel,
  data,
  barColor,
  footerLabel,
  footerToneClass,
  onBarClick,
}: {
  title: string;
  subtitle: string;
  emptyLabel: string;
  data: { theme: string; count: number }[];
  barColor: string;
  footerLabel: string;
  footerToneClass: string;
  onBarClick: (theme: string) => void;
}) {
  const top = topTheme(data);

  return (
    <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6 h-full flex flex-col">
      <h3 className="mb-1">{title}</h3>
      <p className="text-xs text-bs-neutral-500 mb-3">{subtitle}</p>
      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-bs-neutral-500">
          {emptyLabel}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis dataKey="theme" stroke="#737373" />
            <YAxis stroke="#737373" allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="count"
              fill={barColor}
              radius={[8, 8, 0, 0]}
              cursor="pointer"
              onClick={(event) => {
                const ev: any = event;
                const theme = ev.payload?.theme ?? ev.theme;
                if (theme) onBarClick(theme);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
      {top && (
        <div className="mt-4 text-sm text-bs-neutral-600">
          {footerLabel}{" "}
          <span className={`font-bold ${footerToneClass}`}>
            {top.theme} ({top.count} mentions)
          </span>
        </div>
      )}
    </div>
  );
}

export function SentimentTab({
  sentiment,
  handleThemeClick,
}: SentimentTabProps) {
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

  const positiveThemeData = (sentiment.positiveThemes ?? []).map((c) => ({
    theme: c.theme,
    count: c.count ?? 0,
  }));

  return (
    <section aria-labelledby="sentiment-awareness" className="space-y-6">
      <h2 id="sentiment-awareness">Customer Sentiment & Awareness</h2>

      {/* Row 1: Pie full width */}
      <div className="bg-white rounded-lg border-2 border-bs-neutral-200 p-6">
        <h3 className="mb-4 text-center">Review Sentiment</h3>
        <div className="flex items-center justify-center max-w-md mx-auto">
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
                  <Cell key={`sentiment-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-bs-green">
              {sentiment.positivePct ?? 0}%
            </div>
            <div className="text-sm text-bs-neutral-600">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-bs-red">
              {sentiment.negativePct ?? 0}%
            </div>
            <div className="text-sm text-bs-neutral-600">Negative</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#F59E0B]">
              {sentiment.neutralPct ?? 0}%
            </div>
            <div className="text-sm text-bs-neutral-600">Neutral</div>
          </div>
        </div>
      </div>

      {/* Row 2: Positive | Complaints side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThemeBarCard
          title="Top Positive Themes"
          subtitle="What's working - click a bar to see related Google Reviews"
          emptyLabel="No positive theme data yet"
          data={positiveThemeData}
          barColor="#27AE60"
          footerLabel="Most praised:"
          footerToneClass="text-bs-green"
          onBarClick={(theme) => handleThemeClick(theme, "Positive")}
        />
        <ThemeBarCard
          title="Top Complaint Themes"
          subtitle="What to fix — click a bar to see related Google Reviews"
          emptyLabel="No complaint theme data yet"
          data={complaintThemeData}
          barColor="#FF4C4C"
          footerLabel="Most common issue:"
          footerToneClass="text-bs-red"
          onBarClick={(theme) => handleThemeClick(theme, "Negative")}
        />
      </div>
    </section>
  );
}
