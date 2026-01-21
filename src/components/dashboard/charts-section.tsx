import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartsSectionProps {
  loading?: boolean;
}

// Mock Data
const ticketTrend = [
  { date: "Mon", open: 12, resolved: 8 },
  { date: "Tue", open: 15, resolved: 10 },
  { date: "Wed", open: 18, resolved: 15 },
  { date: "Thu", open: 14, resolved: 18 },
  { date: "Fri", open: 20, resolved: 12 },
  { date: "Sat", open: 8, resolved: 6 },
  { date: "Sun", open: 5, resolved: 4 },
];

const efficiencyData = [
  { time: "00:00", cop: 3.2 },
  { time: "04:00", cop: 3.1 },
  { time: "08:00", cop: 3.5 },
  { time: "12:00", cop: 3.8 },
  { time: "16:00", cop: 3.9 },
  { time: "20:00", cop: 3.4 },
];

const alertDistribution = [
  { name: "Critical", value: 5, color: "#ef4444" },
  { name: "Warning", value: 12, color: "#f59e0b" },
  { name: "Info", value: 25, color: "#3b82f6" },
];

export function ChartsSection({ loading }: ChartsSectionProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-[350px] bg-zinc-100 rounded-xl animate-pulse" />
        <div className="col-span-3 h-[350px] bg-zinc-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      {/* Main Ticket Trend Chart */}
      <Card className="col-span-4 border-zinc-100/80 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900">
            Ticket Resolution Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ticketTrend}>
                <defs>
                  <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorResolved"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f4f4f5"
                />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e4e4e7",
                  }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="open"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOpen)"
                  name="Open Tickets"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alert Distribution (3rd row) */}
      <Card className="col-span-full lg:col-span-3 border-zinc-100/80 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900">
            Active Alerts by Severity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {alertDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e4e4e7",
                  }}
                  itemStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 ml-4">
              {alertDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-zinc-600">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="col-span-full lg:col-span-4 grid grid-cols-2 gap-4">
        {/* Placeholder for future widgets */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Weekly Report</h3>
            <p className="text-white/80 text-sm">
              Download the latest efficiency report.
            </p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg w-fit text-sm transition-colors mt-4 backdrop-blur-sm">
            Download PDF
          </button>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">System Health</h3>
            <p className="text-white/80 text-sm">All systems operational.</p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-medium">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
