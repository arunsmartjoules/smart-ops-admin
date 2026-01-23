import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartsSectionProps {
  loading?: boolean;
  ticketsByDay?: { date: string; tickets: number; checkIns: number }[];
  ticketsByCategory?: { name: string; value: number; color: string }[];
}

// Fallback mock data
const defaultTicketsByDay = [
  { date: "Jan 1", tickets: 5, checkIns: 12 },
  { date: "Jan 2", tickets: 8, checkIns: 15 },
  { date: "Jan 3", tickets: 12, checkIns: 18 },
  { date: "Jan 4", tickets: 6, checkIns: 14 },
  { date: "Jan 5", tickets: 10, checkIns: 20 },
  { date: "Jan 6", tickets: 4, checkIns: 8 },
  { date: "Jan 7", tickets: 3, checkIns: 6 },
];

const defaultTicketsByCategory = [
  { name: "HVAC", value: 35, color: "#3b82f6" },
  { name: "Electrical", value: 25, color: "#f59e0b" },
  { name: "Plumbing", value: 15, color: "#10b981" },
  { name: "IT", value: 12, color: "#8b5cf6" },
  { name: "Other", value: 13, color: "#6b7280" },
];

const CATEGORY_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Rose
  "#06b6d4", // Cyan
  "#f43f5e", // Red
  "#6b7280", // Gray
];

export function ChartsSection({
  loading,
  ticketsByDay = defaultTicketsByDay,
  ticketsByCategory = defaultTicketsByCategory,
}: ChartsSectionProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-[350px] bg-zinc-100 rounded-xl animate-pulse" />
        <div className="col-span-3 h-[350px] bg-zinc-100 rounded-xl animate-pulse" />
        <div className="col-span-7 h-[300px] bg-zinc-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Assign colors to categories if not present or override for consistency
  const colorfulCategories = ticketsByCategory.map((item, index) => ({
    ...item,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      {/* 1. Ticket Volume Chart (Bar) - 4/7 width */}
      <Card className="col-span-full lg:col-span-4 border-zinc-100/80 bg-white shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900">
              Ticket Volume
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-1">
              Daily tickets raised over current month
            </p>
          </div>
        </CardHeader>
        <CardContent className="pl-0 pb-4">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ticketsByDay}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="ticketGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f4f4f5"
                />
                <XAxis
                  dataKey="date"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickMargin={10}
                />
                <Tooltip
                  cursor={{ fill: "#f4f4f5", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow:
                      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#3b82f6",
                  }}
                  labelStyle={{
                    fontSize: "11px",
                    color: "#71717a",
                    marginBottom: "4px",
                    fontWeight: "600",
                  }}
                />
                <Bar
                  dataKey="tickets"
                  fill="url(#ticketGradient)"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                  name="Tickets"
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Ticket Categories (Pie) - 3/7 width */}
      <Card className="col-span-full lg:col-span-3 border-zinc-100/80 bg-white shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-zinc-900">
            Categories
          </CardTitle>
          <p className="text-xs text-zinc-500">
            Distribution by equipment type
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center pb-6">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={colorfulCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {colorfulCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="rgba(255,255,255,0.2)"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                  formatter={(value: any, name: any, props: any) => [
                    value,
                    props.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center px-4">
            {colorfulCategories.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium text-zinc-600">
                  {item.name}
                  <span className="text-zinc-400 ml-1">({item.value})</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Check-in Activity (Area) - Full Width */}
      <Card className="col-span-full border-zinc-100/80 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-zinc-900">
            Staff Check-ins
          </CardTitle>
          <p className="text-xs text-zinc-500">Daily attendance activity</p>
        </CardHeader>
        <CardContent className="pl-0 pb-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={ticketsByDay}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="checkInGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f4f4f5"
                />
                <XAxis
                  dataKey="date"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickMargin={10}
                />
                <Tooltip
                  cursor={{ stroke: "#10b981", strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#059669",
                  }}
                  labelStyle={{
                    fontSize: "11px",
                    color: "#71717a",
                    marginBottom: "4px",
                    fontWeight: "600",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="checkIns"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#checkInGradient)"
                  name="Check-ins"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
