import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { Loader, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { admin_payrollService, type PayrollStatistics } from "@/services/admin_payrollService";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";

const COLORS = ["#FDE033", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function admin_PayrollStatisticsPage() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [monthlyStats, setMonthlyStats] = useState<PayrollStatistics[]>([]);
  const [roleStats, setRoleStats] = useState<PayrollStatistics[]>([]);
  const [last12Months, setLast12Months] = useState<PayrollStatistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  const roles = ["Account Executive", "Director", "Accountant", "Chairman", "Security Officer"];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/staff-login");
    }

    // Set default month to current month
    const today = new Date();
    setSelectedMonth(today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0"));
  }, [navigate]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Fetch monthly statistics
      if (selectedMonth) {
        try {
          const monthData = await admin_payrollService.getMonthlyStatistics(selectedMonth);
          setMonthlyStats(Array.isArray(monthData) ? monthData : [monthData]);
        } catch (err) {
          // Month may not have data yet
          setMonthlyStats([]);
        }
      }

      // Fetch last 12 months
      try {
        const last12Data = await admin_payrollService.getLast12MonthsStatistics();
        setLast12Months(Array.isArray(last12Data) ? last12Data : []);
      } catch (err) {
        setLast12Months([]);
      }

      // Fetch role statistics
      if (selectedRole !== "ALL") {
        try {
          const roleData = await admin_payrollService.getStatisticsForRole(selectedRole);
          setRoleStats(Array.isArray(roleData) ? roleData : [roleData]);
        } catch (err) {
          setRoleStats([]);
        }
      }

      toast.success("Statistics loaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  // Calculate totals for current month
  const monthTotal = monthlyStats.reduce((sum, s) => sum + s.totalAmount, 0);
  const monthCount = monthlyStats.reduce((sum, s) => sum + s.totalProcessed, 0);
  const monthAverage = monthCount > 0 ? monthTotal / monthCount : 0;

  // Calculate totals for last 12 months
  const last12Total = last12Months.reduce((sum, s) => sum + s.totalAmount, 0);
  const last12Count = last12Months.reduce((sum, s) => sum + s.totalProcessed, 0);
  const last12Average = last12Count > 0 ? last12Total / last12Count : 0;

  // Summary Stats
  const summaryStats = [
    {
      title: "Payrolls This Month",
      value: monthCount,
      unit: "records",
      color: "from-blue-500/20 to-blue-500/5",
      icon: "📊",
    },
    {
      title: "Total Disbursed",
      value: formatCurrency(monthTotal),
      unit: "",
      color: "from-primary/20 to-primary/5",
      icon: "💰",
    },
    {
      title: "Average Salary",
      value: formatCurrency(monthAverage),
      unit: "",
      color: "from-green-500/20 to-green-500/5",
      icon: "📈",
    },
    {
      title: "12-Month Total",
      value: formatCurrency(last12Total),
      unit: "",
      color: "from-purple-500/20 to-purple-500/5",
      icon: "📅",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user?.fullName || "User"}
        userRole={user?.role || ""}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/staff-login");
        }}
      />

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payroll Statistics & Analytics</h1>
            <p className="text-muted-foreground">Monitor payroll performance and trends</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, i) => (
            <Card key={i} className={`border-border/50 dark:bg-card/50 bg-gradient-to-br ${stat.color}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    {stat.unit && <p className="text-xs text-muted-foreground mt-1">{stat.unit}</p>}
                  </div>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-border/50 dark:bg-card/50">
          <CardHeader>
            <CardTitle>Filters & Period Selection</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <div className="flex gap-2 items-end">
              <div>
                <Label htmlFor="month" className="text-xs">
                  Select Month
                </Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={fetchStatistics} disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                Load Statistics
              </Button>
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <Label htmlFor="role" className="text-xs">
                  Filter by Role
                </Label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background text-foreground"
                >
                  <option value="ALL">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Month Breakdown by Role */}
          {monthlyStats.length > 0 && (
            <Card className="border-border/50 dark:bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Payroll Breakdown - {selectedMonth}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="role" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                      formatter={(value) => [formatCurrency(value as number), "Amount"]}
                    />
                    <Legend />
                    <Bar dataKey="totalAmount" fill="#FDE033" name="Total Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Role Distribution Pie */}
          {monthlyStats.length > 0 && (
            <Card className="border-border/50 dark:bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Distribution by Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={monthlyStats}
                      dataKey="totalAmount"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ role, value }) => `${role}: ${formatCurrency(value as number)}`}
                    >
                      {monthlyStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 12-Month Trend */}
        {last12Months.length > 0 && (
          <Card className="border-border/50 dark:bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                12-Month Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={last12Months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="payMonth" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                    formatter={(value) => [formatCurrency(value as number), "Amount"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="#FDE033"
                    strokeWidth={2}
                    dot={{ fill: "#FDE033", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Total Amount"
                  />
                  <Line
                    type="monotone"
                    dataKey="averageSalary"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Average Salary"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Detailed Statistics Table */}
        {monthlyStats.length > 0 && (
          <Card className="border-border/50 dark:bg-card/50">
            <CardHeader>
              <CardTitle>Detailed Statistics - {selectedMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Total Processed</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Average Salary</TableHead>
                      <TableHead className="text-right">Max Salary</TableHead>
                      <TableHead className="text-right">Min Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyStats.map((stat) => (
                      <TableRow key={stat.role} className="border-b border-border/30">
                        <TableCell className="font-semibold text-foreground">{stat.role}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-muted">
                            {stat.totalProcessed}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(stat.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(stat.averageSalary)}</TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400">
                          {formatCurrency(stat.totalAmount / (stat.totalProcessed || 1))}
                        </TableCell>
                        <TableCell className="text-right text-orange-600 dark:text-orange-400">
                          {formatCurrency(stat.totalAmount / (stat.totalProcessed || 1))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {!loading && monthlyStats.length === 0 && (
          <Card className="border-border/50 dark:bg-card/50">
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No payroll statistics available for the selected period</p>
              <p className="text-sm text-muted-foreground mt-1">Process and send payrolls to bank to see statistics</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
