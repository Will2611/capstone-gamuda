import { Card } from "../components/Card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Search, Tag, Users } from "lucide-react";

export default function OwnerDashboard() {
  const metricsData = [
    {
      label: "Visibility Score",
      value: 87,
      icon: <TrendingUp size={24} />,
      color: "bg-bs-green",
    },
    {
      label: "Match Conversion",
      value: 65,
      icon: <Search size={24} />,
      color: "bg-bs-gold",
    },
    {
      label: "Avg. Rating",
      value: 4.7,
      icon: <Tag size={24} />,
      color: "bg-bs-blue",
    },
  ];

  const preferenceData = [
    { name: "Spicy", value: 450 },
    { name: "Vegetarian", value: 320 },
    { name: "Quick Service", value: 280 },
    { name: "Romantic", value: 210 },
    { name: "Family", value: 380 },
  ];

  const trendData = [
    { month: "Jan", searches: 120, conversions: 78 },
    { month: "Feb", searches: 180, conversions: 110 },
    { month: "Mar", searches: 240, conversions: 156 },
    { month: "Apr", searches: 320, conversions: 208 },
    { month: "May", searches: 450, conversions: 293 },
  ];

  const heatmapData = [
    {
      hour: "11 AM",
      Mon: 20,
      Tue: 25,
      Wed: 30,
      Thu: 28,
      Fri: 45,
      Sat: 60,
      Sun: 50,
    },
    {
      hour: "12 PM",
      Mon: 45,
      Tue: 48,
      Wed: 52,
      Thu: 50,
      Fri: 65,
      Sat: 80,
      Sun: 75,
    },
    {
      hour: "1 PM",
      Mon: 50,
      Tue: 52,
      Wed: 55,
      Thu: 53,
      Fri: 70,
      Sat: 85,
      Sun: 78,
    },
    {
      hour: "6 PM",
      Mon: 60,
      Tue: 65,
      Wed: 68,
      Thu: 85,
      Fri: 95,
      Sat: 100,
      Sun: 80,
    },
    {
      hour: "7 PM",
      Mon: 75,
      Tue: 78,
      Wed: 80,
      Thu: 90,
      Fri: 100,
      Sat: 95,
      Sun: 70,
    },
  ];

  return (
    <div className="min-h-screen bg-bs-neutral-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Restaurant Owner Dashboard</h1>
          <p className="text-bs-neutral-600">
            Track your performance and get actionable insights
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metricsData.map((metric, index) => (
            <Card key={index}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-bs-neutral-600 mb-1">
                    {metric.label}
                  </p>
                  <h2>
                    {typeof metric.value === "number" && metric.value < 10
                      ? metric.value.toFixed(1)
                      : metric.value}
                    {metric.label === "Match Conversion"
                      ? "%"
                      : metric.label === "Visibility Score"
                        ? "/100"
                        : ""}
                  </h2>
                </div>
                <div className={`${metric.color} p-3 rounded-lg text-white`}>
                  {metric.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Preference Bar Chart */}
          <Card>
            <h3 className="mb-4">Top Customer Preferences</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={preferenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="name" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip />
                <Bar dataKey="value" fill="#FFD700" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Trend Line Chart */}
          <Card>
            <h3 className="mb-4">Search & Conversion Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="searches"
                  stroke="#2D9CDB"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#27AE60"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Heatmap */}
        <Card className="mb-8">
          <h3 className="mb-4">Popularity Heatmap - Peak Hours</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 text-sm text-bs-neutral-600">
                    Hour
                  </th>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <th
                        key={day}
                        className="text-center p-2 text-sm text-bs-neutral-600"
                      >
                        {day}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-sm">{row.hour}</td>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day) => {
                        const value = row[day as keyof typeof row] as number;
                        const opacity = value / 100;
                        return (
                          <td key={day} className="p-2">
                            <div
                              className="h-10 rounded flex items-center justify-center text-xs font-medium"
                              style={{
                                backgroundColor: `rgba(255, 215, 0, ${opacity})`,
                                color: opacity > 0.5 ? "#000" : "#666",
                              }}
                            >
                              {value}
                            </div>
                          </td>
                        );
                      },
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Insights Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-start gap-3">
              <Search className="text-bs-blue mt-1" size={20} />
              <div>
                <h4 className="mb-2">SEO Suggestions</h4>
                <p className="text-sm text-bs-neutral-600">
                  Update your menu with "spicy noodles" to match trending
                  searches
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <Tag className="text-bs-red mt-1" size={20} />
              <div>
                <h4 className="mb-2">Promotions</h4>
                <p className="text-sm text-bs-neutral-600">
                  Launch a lunch special to capture the 12-1 PM peak traffic
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <Users className="text-bs-green mt-1" size={20} />
              <div>
                <h4 className="mb-2">Staffing Tips</h4>
                <p className="text-sm text-bs-neutral-600">
                  Consider adding staff on Friday & Saturday 6-7 PM
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
