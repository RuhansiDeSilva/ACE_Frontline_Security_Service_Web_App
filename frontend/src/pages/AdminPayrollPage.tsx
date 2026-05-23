import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader, DollarSign, Check, AlertCircle, Plus } from "lucide-react";
import { adminPayrollService, type AdminPayrollRequest, type PayrollResponse } from "@/services/adminPayrollService";
import { authService, type UserProfile } from "@/services/authService";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";

const ALLOWANCE_TYPES = [
  { id: "housing", label: "Housing Allowance" },
  { id: "transport", label: "Transport Allowance" },
  { id: "food", label: "Food Allowance" },
  { id: "medical", label: "Medical Allowance" },
  { id: "bonus", label: "Bonus" },
  { id: "other", label: "Other Allowance" },
];

export default function AdminPayrollPage() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  // Salary components
  const [payMonth, setPayMonth] = useState("");
  const [basicSalary, setBasicSalary] = useState(0);
  const [allowances, setAllowances] = useState<Record<string, number>>({});
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/staff-login");
    }

    // Set default month to current month
    const today = new Date();
    setPayMonth(today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0"));
  }, [navigate]);

  const handleSearchEmployee = async () => {
    if (!employeeId) {
      toast.error("Please enter employee ID");
      return;
    }

    setSearching(true);
    try {
      // Fetch employee profile
      const employees = await authService.getMyProfile(); // This gets current user, we need to fetch all users
      // For now, we'll use a mock or need to create an endpoint to get user by ID
      toast.error("Employee lookup not fully implemented - use existing endpoints");
    } catch (error: any) {
      toast.error(error.message || "Failed to find employee");
    } finally {
      setSearching(false);
    }
  };

  const handleAllowanceChange = (allowanceId: string, amount: number) => {
    setAllowances((prev) => ({
      ...prev,
      [allowanceId]: amount,
    }));
  };

  const handleAllowanceToggle = (allowanceId: string, checked: boolean) => {
    if (!checked) {
      handleAllowanceChange(allowanceId, 0);
    }
  };

  const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
  const totalDeductions = otherDeductions;
  const grossSalary = basicSalary + totalAllowances;
  const netSalary = grossSalary - totalDeductions;

  const handleCreatePayroll = async () => {
    if (!employee) {
      toast.error("Please search and select an employee first");
      return;
    }

    if (!payMonth) {
      toast.error("Please select a pay month");
      return;
    }

    if (basicSalary <= 0) {
      toast.error("Basic salary must be greater than 0");
      return;
    }

    setCreating(true);
    try {
      const request: AdminPayrollRequest = {
        employeeId: employee.id,
        payMonth,
        basicSalary,
        allowances: totalAllowances,
        allowancesDetail: Object.fromEntries(Object.entries(allowances).filter(([, v]) => v > 0)),
        otherDeductions: otherDeductions || 0,
        remarks,
      };

      const result = await adminPayrollService.createPayroll(request);
      toast.success("Payroll created successfully");
      // Reset form
      setEmployee(null);
      setEmployeeId("");
      setAllowances({});
      setOtherDeductions(0);
      setRemarks("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create payroll");
    } finally {
      setCreating(false);
    }
  };

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
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Payroll Management</h1>
            <p className="text-muted-foreground">Create and manage employee payroll</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Employee Lookup and Input */}
          <div className="md:col-span-2 space-y-6">
            {/* Employee Lookup */}
            <Card className="border-border/50 dark:bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="employeeId"
                        type="number"
                        placeholder="Enter employee ID"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                      />
                      <Button
                        onClick={handleSearchEmployee}
                        disabled={searching || !employeeId}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {searching ? <Loader className="h-4 w-4 animate-spin" /> : "Search"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payMonth">Pay Month *</Label>
                    <Input
                      id="payMonth"
                      type="month"
                      value={payMonth}
                      onChange={(e) => setPayMonth(e.target.value)}
                    />
                  </div>
                </div>

                {/* Employee Details Display */}
                {employee && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-semibold text-foreground">{employee.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="font-semibold text-foreground">{employee.role}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Basic Salary (Auto-populated)</p>
                        <p className="font-semibold text-primary text-lg">
                          {basicSalary.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Salary Components */}
            <Card className="border-border/50 dark:bg-card/50">
              <CardHeader>
                <CardTitle>Salary Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Components */}
                  <div className="space-y-2">
                    <Label htmlFor="basicSalary">Basic Salary</Label>
                    <Input
                      id="basicSalary"
                      type="number"
                      step="0.01"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                
                {/* Allowances */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Allowances</h3>
                  <div className="space-y-2">
                    {ALLOWANCE_TYPES.map((allowance) => (
                      <div key={allowance.id} className="flex items-end gap-2">
                        <Checkbox
                          id={allowance.id}
                          checked={!!allowances[allowance.id]}
                          onCheckedChange={(checked) => handleAllowanceToggle(allowance.id, checked as boolean)}
                        />
                        <Label htmlFor={allowance.id} className="flex-1 text-sm">
                          {allowance.label}
                        </Label>
                        {allowances[allowance.id] && (
                          <Input
                            type="number"
                            step="0.01"
                            value={allowances[allowance.id]}
                            onChange={(e) => handleAllowanceChange(allowance.id, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-24"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="otherDeductions">Other Deductions</Label>
                    <Input
                      id="otherDeductions"
                      type="number"
                      step="0.01"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any additional notes about this payroll..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="min-h-24"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Payroll Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Summary Table */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-semibold">{basicSalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Allowances</span>
                    <span className="font-semibold text-primary">{totalAllowances.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Gross Salary</span>
                    <span className="font-bold text-primary text-lg">{grossSalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="mt-4 pt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Other Deductions</span>
                      <span>-{otherDeductions.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-3 mt-4 border-t-2 border-primary bg-primary/5 px-2 rounded">
                    <span className="font-bold text-foreground">Net Salary</span>
                    <span className="font-bold text-primary text-lg">{netSalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <Button
                    onClick={handleCreatePayroll}
                    disabled={!employee || creating || !payMonth}
                    className="w-full bg-primary hover:bg-primary/90 font-semibold"
                  >
                    {creating ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create & Submit Payroll
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Payroll will be submitted to director for approval
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
