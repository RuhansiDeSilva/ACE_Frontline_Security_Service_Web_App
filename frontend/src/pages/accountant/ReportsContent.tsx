import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw } from "lucide-react";
import DashboardStatisticsChart from "@/components/DashboardStatisticsChart";
import { adminPayrollService, type PayrollResponse, type PayrollStatistics } from "@/services/adminPayrollService";
import { invoiceApi } from "@/lib/api";
import { paymentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PayrollTrendData {
  month: string;
  pending: number;
  approved: number;
  rejected: number;
}

interface InvoiceData {
  name: string;
  value: number;
}

interface PaymentDistributionData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

export default function ReportsContent() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Payroll Trends Data
  const [payrollTrendData, setPayrollTrendData] = useState<PayrollTrendData[]>([
    { month: "Jan", pending: 0, approved: 0, rejected: 0 },
    { month: "Feb", pending: 0, approved: 0, rejected: 0 },
    { month: "Mar", pending: 0, approved: 0, rejected: 0 },
    { month: "Apr", pending: 0, approved: 0, rejected: 0 },
    { month: "May", pending: 0, approved: 0, rejected: 0 },
    { month: "Jun", pending: 0, approved: 0, rejected: 0 },
  ]);

  // Invoice Status Data
  const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([
    { name: "Created", value: 0 },
    { name: "Approved", value: 0 },
    { name: "Issued", value: 0 },
    { name: "Paid", value: 0 },
  ]);

  // Payment Distribution Data
  const [paymentDistributionData, setPaymentDistributionData] = useState<PaymentDistributionData[]>([
    { name: "Verified", value: 0, color: "#3b82f6" },
    { name: "Pending", value: 0, color: "#f59e0b" },
    { name: "Rejected", value: 0, color: "#ef4444" },
  ]);

  // Monthly Revenue Data
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyRevenueData[]>([
    { month: "Jan", revenue: 0, expenses: 0 },
    { month: "Feb", revenue: 0, expenses: 0 },
    { month: "Mar", revenue: 0, expenses: 0 },
    { month: "Apr", revenue: 0, expenses: 0 },
    { month: "May", revenue: 0, expenses: 0 },
    { month: "Jun", revenue: 0, expenses: 0 },
  ]);

  // Load data on component mount
  useEffect(() => {
    refreshReport();
  }, []);

  // Function to refresh report data
  const refreshReport = async () => {
    setIsLoading(true);
    try {
      // Fetch payroll data - get both pending and approved
      const pendingPayrolls = await adminPayrollService.getPendingApprovals().catch(() => []);
      const approvedPayrolls = await adminPayrollService.getApprovedPayrolls().catch(() => []);
      const allPayrolls = [...pendingPayrolls, ...approvedPayrolls];
      
      // Fetch invoice data
      const invoices = await invoiceApi.getAll().catch(() => []);
      
      // Fetch payment data
      const payments = await paymentApi.getAll().catch(() => []);

      // Process payroll data for trends
      const payrollByMonth: Record<string, PayrollTrendData> = {};
      allPayrolls.forEach((payroll: PayrollResponse) => {
        const month = new Date(payroll.payMonth + "-01").toLocaleDateString("en-US", { month: "short" });
        if (!payrollByMonth[month]) {
          payrollByMonth[month] = { month, pending: 0, approved: 0, rejected: 0 };
        }
        if (payroll.status === "DRAFT" || payroll.status === "SUBMITTED_TO_DIRECTOR") {
          payrollByMonth[month].pending++;
        } else if (payroll.status === "APPROVED_BY_DIRECTOR" || payroll.status === "SENT_TO_BANK" || payroll.status === "COMPLETED") {
          payrollByMonth[month].approved++;
        } else if (payroll.status === "REJECTED_BY_DIRECTOR") {
          payrollByMonth[month].rejected++;
        }
      });

      // Update payroll trends with real data
      const updatedPayrollTrends = payrollTrendData.map(trend => {
        const data = payrollByMonth[trend.month];
        return data || trend;
      });
      setPayrollTrendData(updatedPayrollTrends);

      // Process invoice data
      const invoiceStatuses: Record<string, number> = {
        "DRAFT": 0,
        "APPROVED": 0,
        "ISSUED": 0,
        "PAID": 0,
      };
      invoices.forEach((invoice: any) => {
        if (invoice.status && invoice.status in invoiceStatuses) {
          invoiceStatuses[invoice.status]++;
        }
      });

      setInvoiceData([
        { name: "Created", value: invoiceStatuses["DRAFT"] },
        { name: "Approved", value: invoiceStatuses["APPROVED"] },
        { name: "Issued", value: invoiceStatuses["ISSUED"] },
        { name: "Paid", value: invoiceStatuses["PAID"] },
      ]);

      // Process payment data
      const paymentStatuses: Record<string, number> = {
        "VERIFIED": 0,
        "PENDING": 0,
        "REJECTED": 0,
      };
      payments.forEach((payment: any) => {
        if (payment.verificationStatus && payment.verificationStatus in paymentStatuses) {
          paymentStatuses[payment.verificationStatus]++;
        }
      });

      setPaymentDistributionData([
        { name: "Verified", value: paymentStatuses["VERIFIED"], color: "#3b82f6" },
        { name: "Pending", value: paymentStatuses["PENDING"], color: "#f59e0b" },
        { name: "Rejected", value: paymentStatuses["REJECTED"], color: "#ef4444" },
      ]);

      // Calculate monthly revenue/expenses from invoices and payments
      const monthlyData: Record<string, MonthlyRevenueData> = {};
      monthlyRevenueData.forEach(item => {
        monthlyData[item.month] = { ...item };
      });

      invoices.forEach((invoice: any) => {
        if (invoice.createdAt) {
          const month = new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "short" });
          if (monthlyData[month]) {
            monthlyData[month].revenue += invoice.totalAmount || 0;
          }
        }
      });

      allPayrolls.forEach((payroll: PayrollResponse) => {
        const month = new Date(payroll.payMonth + "-01").toLocaleDateString("en-US", { month: "short" });
        if (monthlyData[month]) {
          monthlyData[month].expenses += payroll.netSalary || 0;
        }
      });

      setMonthlyRevenueData(Object.values(monthlyData));

      toast({
        title: "Success",
        description: "Report data refreshed successfully",
      });
    } catch (error) {
      console.error("Failed to load report data:", error);
      toast({
        title: "Error",
        description: "Failed to load report data. Using default values.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Financial Reports
            </h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive financial analytics and performance metrics
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Refresh Button */}
          <Button
            onClick={refreshReport}
            disabled={isLoading}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* Analytics Charts */}
      <DashboardStatisticsChart
        payrollTrendData={payrollTrendData}
        invoiceData={invoiceData}
        paymentDistributionData={paymentDistributionData}
        monthlyRevenueData={monthlyRevenueData}
        title=""
        showTitle={false}
      />

      {/* Data Update Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-600">📊 Real-Time Data Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            ✓ Charts update automatically when payroll, invoice, or financial data changes
          </p>
          <p className="text-muted-foreground">
            ✓ Use the "Refresh Data" button to manually update all analytics
          </p>
          <p className="text-muted-foreground">
            ✓ Data reflects the latest pending payrolls, approved invoices, and revenue metrics
          </p>
          <p className="text-muted-foreground">
            💡 <strong>Tip:</strong> Create or update payroll, invoices, or payment records to see the charts change in real-time
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
