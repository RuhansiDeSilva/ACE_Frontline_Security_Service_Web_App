import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";

interface PayrollTrendDataType {
  month: string;
  pending: number;
  approved: number;
  rejected: number;
}

interface InvoiceDataType {
  name: string;
  value: number;
}

interface PaymentDistributionDataType {
  name: string;
  value: number;
  color: string;
}

interface MonthlyRevenueDataType {
  month: string;
  revenue: number;
  expenses: number;
}

interface DashboardStatisticsChartProps {
  payrollTrendData?: PayrollTrendDataType[];
  invoiceData?: InvoiceDataType[];
  paymentDistributionData?: PaymentDistributionDataType[];
  monthlyRevenueData?: MonthlyRevenueDataType[];
  title?: string;
  showTitle?: boolean;
}

const defaultPayrollTrendData = [
  { month: "Jan", pending: 8, approved: 12, rejected: 2 },
  { month: "Feb", pending: 10, approved: 14, rejected: 1 },
  { month: "Mar", pending: 12, approved: 18, rejected: 3 },
  { month: "Apr", pending: 9, approved: 16, rejected: 2 },
  { month: "May", pending: 7, approved: 20, rejected: 1 },
  { month: "Jun", pending: 12, approved: 22, rejected: 4 },
];

const defaultInvoiceData = [
  { name: "Created", value: 45 },
  { name: "Pending", value: 12 },
  { name: "Paid", value: 28 },
  { name: "Overdue", value: 5 },
];

const defaultPaymentDistributionData = [
  { name: "Salary", value: 45, color: "#3b82f6" },
  { name: "Advance", value: 25, color: "#10b981" },
  { name: "Loan", value: 20, color: "#f59e0b" },
  { name: "Other", value: 10, color: "#8b5cf6" },
];

const defaultMonthlyRevenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 35000 },
  { month: "Mar", revenue: 48000, expenses: 33000 },
  { month: "Apr", revenue: 61000, expenses: 40000 },
  { month: "May", revenue: 55000, expenses: 38000 },
  { month: "Jun", revenue: 67000, expenses: 42000 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function DashboardStatisticsChart({
  payrollTrendData = defaultPayrollTrendData,
  invoiceData = defaultInvoiceData,
  paymentDistributionData = defaultPaymentDistributionData,
  monthlyRevenueData = defaultMonthlyRevenueData,
  title = "Financial Analytics & Reports",
  showTitle = true,
}: DashboardStatisticsChartProps) {
  return (
    <div className="space-y-8">
      {/* Statistics Title */}
      {showTitle && (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trend Chart */}
        <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Payroll Trends
            </CardTitle>
            <CardDescription>Pending vs Approved vs Rejected (Last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={payrollTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Pending"
                />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Approved"
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Rejected"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status Chart */}
        <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Invoice Status Distribution
            </CardTitle>
            <CardDescription>Current invoice count by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={invoiceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Count">
                  {invoiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Distribution Pie Chart */}
        <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Payment Distribution
            </CardTitle>
            <CardDescription>Breakdown of payment types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Revenue Chart */}
        <Card className="bg-card border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Monthly Revenue vs Expenses
            </CardTitle>
            <CardDescription>Financial performance (Last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyRevenueData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/30 hover:border-primary/60 transition-all">
        <CardHeader>
          <CardTitle className="text-primary">Key Insights & Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card/50 border border-border/50">
              <p className="text-sm font-semibold text-muted-foreground mb-2">📈 Revenue Trend</p>
              <p className="text-2xl font-bold text-green-600">+48.9%</p>
              <p className="text-xs text-muted-foreground mt-1">Growth from January to June</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/50">
              <p className="text-sm font-semibold text-muted-foreground mb-2">💰 Average Monthly Revenue</p>
              <p className="text-2xl font-bold text-blue-600">Rs. 54,666</p>
              <p className="text-xs text-muted-foreground mt-1">Across all 6 months</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border/50">
              <p className="text-sm font-semibold text-muted-foreground mb-2">✅ Approval Rate</p>
              <p className="text-2xl font-bold text-emerald-600">88.7%</p>
              <p className="text-xs text-muted-foreground mt-1">Payroll approval success</p>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4 mt-4">
            <h4 className="font-semibold text-foreground mb-3">Performance Analysis</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Revenue has shown consistent growth with a peak in June at Rs. 67,000</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Salary payments dominate at 45% of total payment distribution</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600">⚠</span>
                <span>5 overdue invoices detected - recommend follow-up actions</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Expense management is efficient with average 74% expense-to-revenue ratio</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">ℹ</span>
                <span>Pending payroll requests average 9.8 per month - consider staffing review</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
