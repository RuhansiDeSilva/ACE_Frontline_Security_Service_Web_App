import { useState, useMemo, useEffect } from "react";
import { Search, FileText, Printer, Download, Plus, Trash2, Shield, Loader, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { authService, type UserProfile } from "@/services/authService";
import { admin_payrollService, type AdminPayrollRequest } from "@/services/admin_payrollService";
import { toast } from "sonner";

interface LineItem {
  id: string;
  name: string;
  amount: number;
}

const defaultAllowances: LineItem[] = [
  { id: "attendance", name: "Attendance Bonus", amount: 0 },
  { id: "bonus", name: "Special Bonus", amount: 0 },
];

const defaultDeductions: LineItem[] = [
  { id: "epf", name: "EPF (8%)", amount: 0 },
];

export default function admin_PayrollPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const [idQuery, setIdQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [allEmployees, setAllEmployees] = useState<UserProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [allowances, setAllowances] = useState<LineItem[]>(defaultAllowances.map(a => ({ ...a })));
  const [deductions, setDeductions] = useState<LineItem[]>(defaultDeductions.map(d => ({ ...d })));
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/staff-login");
    }
    
    // Fetch all employees for autocomplete
    const fetchEmployees = async () => {
      try {
        const employees = await authService.getAllUsers();
        setAllEmployees(employees);
      } catch (error) {
        console.warn("Failed to fetch employees list:", error);
      }
    };
    
    fetchEmployees();
  }, [navigate]);

  const handleSearch = async () => {
    const trimmed = idQuery.trim();
    if (!trimmed) {
      setSearchError("Please enter an employee ID");
      return;
    }

    setSearching(true);
    setSearchError("");
    setSelectedEmployee(null);
    
    try {
      const found = await authService.getUserById(trimmed);
      
      // Validate that the employee is not a security officer
      const normalizedRole = (found.role || "").toString().toUpperCase();
      if (normalizedRole.includes("SECURITY")) {
        setSearchError(`🚫 RESTRICTED: ID ${found.id} (${found.fullName}) is a Security Officer. Payroll generation is NOT ALLOWED for Security Officer roles. Please select a different employee.`);
        toast.error("Cannot generate payroll for Security Officers", {
          description: "This role is restricted from payroll generation",
          duration: 5000,
        });
        setSelectedEmployee(null);
        setAllowances(defaultAllowances.map((a) => ({ ...a })));
        setDeductions(defaultDeductions.map((d) => ({ ...d })));
        return;
      }
      
      setSelectedEmployee(found);
      setAllowances(defaultAllowances.map((a) => ({ ...a })));
      
      const basic = found.basicSalary || 0;
      setDeductions(
        defaultDeductions.map((d) =>
          d.id === "epf" ? { ...d, amount: Math.round(basic * 0.08) } : { ...d }
        )
      );
      toast.success(`Employee ${found.fullName} found`);
    } catch (error: any) {
      setSearchError(error.message || "No employee found with this ID");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchByEmployee = (employee: UserProfile) => {
    // Validate that the employee is not a security officer
    const normalizedRole = (employee.role || "").toString().toUpperCase();
    if (normalizedRole.includes("SECURITY")) {
      setSearchError(`🚫 RESTRICTED: ID ${employee.id} (${employee.fullName}) is a Security Officer. Payroll generation is NOT ALLOWED for Security Officer roles. Please select a different employee.`);
      toast.error("Cannot generate payroll for Security Officers", {
        description: "This role is restricted from payroll generation",
        duration: 5000,
      });
      setSelectedEmployee(null);
      setAllowances(defaultAllowances.map((a) => ({ ...a })));
      setDeductions(defaultDeductions.map((d) => ({ ...d })));
      return;
    }
    
    setSelectedEmployee(employee);
    setAllowances(defaultAllowances.map((a) => ({ ...a })));
    
    const basic = employee.basicSalary || 0;
    setDeductions(
      defaultDeductions.map((d) =>
        d.id === "epf" ? { ...d, amount: Math.round(basic * 0.08) } : { ...d }
      )
    );
    toast.success(`Employee ${employee.fullName} found`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Get filtered employee suggestions (excluding security officers)
  const filteredSuggestions = idQuery.trim() ? allEmployees.filter(emp => {
    const normalizedRole = (emp.role || "").toString().toUpperCase();
    // Exclude security officers from suggestions
    if (normalizedRole.includes("SECURITY")) return false;
    
    return emp.id.toString().includes(idQuery) || 
      emp.fullName.toLowerCase().includes(idQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(idQuery.toLowerCase());
  }) : [];

  // Get restricted security officers that match search
  const restrictedSecurityOfficers = idQuery.trim() ? allEmployees.filter(emp => {
    const normalizedRole = (emp.role || "").toString().toUpperCase();
    // Only show security officers that match search
    if (!normalizedRole.includes("SECURITY")) return false;
    
    return emp.id.toString().includes(idQuery) || 
      emp.fullName.toLowerCase().includes(idQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(idQuery.toLowerCase());
  }) : [];

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<LineItem[]>>,
    id: string,
    field: "name" | "amount",
    value: string | number
  ) => setter((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));

  const addItem = (setter: React.Dispatch<React.SetStateAction<LineItem[]>>) =>
    setter((prev) => [...prev, { id: `c-${Date.now()}`, name: "", amount: 0 }]);

  const removeItem = (setter: React.Dispatch<React.SetStateAction<LineItem[]>>, id: string) =>
    setter((prev) => prev.filter((item) => item.id !== id));

  const basic = selectedEmployee?.basicSalary ?? 0;

  const totalAllowances = allowances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const totalDeductions = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  
  const grossPay = basic + totalAllowances;
  const netPay = grossPay - totalDeductions;

  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const nextMonth = useMemo(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const monthLabel = useMemo(() => {
    if (!month) return "";
    const [y, m] = month.split("-");
    const d = new Date(Number(y), Number(m) - 1);
    if (isNaN(d.getTime())) return month;
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [month]);

  const isValidPayrollMonth = (candidateMonth: string) =>
    !!candidateMonth && candidateMonth >= currentMonth && candidateMonth <= nextMonth;

  const handleMonthChange = (newMonth: string) => {
    if (!isValidPayrollMonth(newMonth)) {
      toast.error("Pay month must be current month or next month only");
      setMonth(currentMonth);
      return;
    }
    setMonth(newMonth);
  };

  const handleCreatePayroll = async () => {
    if (!selectedEmployee) {
      toast.error("Please search and select an employee first");
      return;
    }

    const normalizedRole = (selectedEmployee.role || "").toString().toUpperCase();
    if (normalizedRole.includes("SECURITY")) {
      toast.error("Cannot create payroll for security officers");
      return;
    }

    if (!month || !isValidPayrollMonth(month)) {
      toast.error("Please select a valid pay month (current or next month)");
      return;
    }

    setCreating(true);
    try {
      // Map allowances and deductions correctly
      const otherAllowancesList = allowances.filter(a => a.amount > 0);
      const otherAllowancesTotal = otherAllowancesList.reduce((sum, a) => sum + Number(a.amount), 0);
      const allowancesDetail: Record<string, number> = {};
      otherAllowancesList.forEach(a => { allowancesDetail[a.name] = Number(a.amount); });

      const otherDeductionsList = deductions.filter(d => d.amount > 0);
      const otherDeductionsAmount = otherDeductionsList.reduce((sum, d) => sum + Number(d.amount), 0);

      const request: AdminPayrollRequest = {
        employeeId: selectedEmployee.id,
        payMonth: month,
        basicSalary: basic,
        otAmount: 0,
        allowances: otherAllowancesTotal,
        allowancesDetail: allowancesDetail,
        loanDeduction: 0,
        advanceDeduction: 0,
        otherDeductions: otherDeductionsAmount,
        remarks: "Generated via Administrator Payroll Interface"
      };

      await admin_payrollService.createPayroll(request);
      toast.success("Payroll created and submitted for approval successfully");
      
      // Reset form
      setSelectedEmployee(null);
      setIdQuery("");
      setAllowances(defaultAllowances.map(a => ({...a})));
      setDeductions(defaultDeductions.map(d => ({...d})));
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
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 mt-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Payroll Generator</h1>
              <p className="text-xs text-muted-foreground">Generate monthly paysheet templates and submit</p>
            </div>
          </div>
          <Input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            min={currentMonth}
            max={nextMonth}
            className="w-44"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-5">
        {/* ID Search Bar */}
        <Card>
          <CardContent className="p-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Employee ID
            </label>
            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter Employee ID (e.g. 1, 2, 3...) or Name"
                  value={idQuery}
                  onChange={(e) => { 
                    setIdQuery(e.target.value); 
                    setSearchError(""); 
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => idQuery && setShowSuggestions(true)}
                  className="pl-10"
                />
                {/* Autocomplete Dropdown */}
                {showSuggestions && (filteredSuggestions.length > 0 || restrictedSecurityOfficers.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                    {/* Allowed Employees */}
                    {filteredSuggestions.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setIdQuery(emp.id.toString());
                          setShowSuggestions(false);
                          // Trigger search for this employee
                          setTimeout(() => handleSearchByEmployee(emp), 100);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors border-b border-border/50 last:border-b-0 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{emp.fullName}</p>
                            <p className="text-xs text-muted-foreground">ID: {emp.id} • {emp.designation || "Employee"}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded dark:bg-green-950 dark:text-green-200">Available</span>
                        </div>
                      </button>
                    ))}

                    {/* Restricted Security Officers */}
                    {restrictedSecurityOfficers.length > 0 && (
                      <>
                        {filteredSuggestions.length > 0 && (
                          <div className="border-t border-border/50 my-1" />
                        )}
                        {restrictedSecurityOfficers.map((emp) => (
                          <div
                            key={emp.id}
                            className="w-full px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900 cursor-not-allowed opacity-75"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 line-through">{emp.fullName}</p>
                                <p className="text-xs text-amber-700 dark:text-amber-200">ID: {emp.id} • {emp.designation || "Security Officer"}</p>
                              </div>
                              <span className="text-xs px-2 py-1 bg-amber-200 text-amber-900 rounded dark:bg-amber-800 dark:text-amber-100 font-semibold flex items-center gap-1">
                                <span>🚫</span> Restricted
                              </span>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">Security Officers cannot have payroll generated</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <Loader className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
            {searchError && (
              <div className={`text-xs mt-3 p-4 rounded-lg border-l-4 font-medium ${searchError.includes("RESTRICTED") 
                ? "bg-red-50 border-l-red-500 text-red-900 dark:bg-red-950 dark:text-red-200" 
                : "bg-amber-50 border-l-amber-500 text-amber-800 dark:bg-amber-950 dark:text-amber-200"}`}>
                {searchError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-populated Detail Bars */}
        {selectedEmployee && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Name */}
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Full Name</label>
                <p className="text-sm font-medium text-foreground mt-0.5 truncate">{selectedEmployee.fullName}</p>
              </div>
              {/* NIC */}
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">NIC Number</label>
                <p className="text-sm font-medium text-foreground mt-0.5">{selectedEmployee.nicNumber || "N/A"}</p>
              </div>
              {/* Designation */}
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Designation</label>
                <p className="text-sm font-medium text-foreground mt-0.5">{selectedEmployee.designation || "N/A"}</p>
              </div>
              {/* Area */}
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Assigned Area</label>
                <p className="text-sm font-medium text-foreground mt-0.5 truncate">{selectedEmployee.assignedArea || "N/A"}</p>
              </div>
              {/* Company */}
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Company</label>
                <p className="text-sm font-medium text-foreground mt-0.5 truncate">{selectedEmployee.assignedCompany || "N/A"}</p>
              </div>
              {/* Bank Name */}
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bank Name</label>
                <p className="text-sm font-medium text-foreground mt-0.5">{selectedEmployee.bankName || "N/A"}</p>
              </div>
              {/* Account No */}
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Account Number</label>
                <p className="text-sm font-medium text-foreground mt-0.5">{selectedEmployee.bankAccountNumber || "N/A"}</p>
              </div>
              {/* Branch */}
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bank Branch</label>
                <p className="text-sm font-medium text-foreground mt-0.5">{selectedEmployee.bankBranch || "N/A"}</p>
              </div>
            </div>

            {/* Salary Template */}
            <Card className="overflow-hidden">
              {/* Template Header */}
              <div className="bg-[hsl(var(--navy))] text-[hsl(var(--gold))] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  <div>
                    <h2 className="text-sm font-bold tracking-wide">ACE FRONTLINE SECURITY (PVT) LTD</h2>
                    <p className="text-xs opacity-80">Monthly Salary Statement — {monthLabel}</p>
                  </div>
                </div>
                <div className="flex gap-2 print:hidden">
                  <Button variant="secondary" size="sm" onClick={() => window.print()}>
                    <Printer className="w-3 h-3 mr-1" /> Print
                  </Button>
                </div>
              </div>

              <CardContent className="p-6 space-y-5">
                {/* Employee Summary Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm border-b border-border pb-4">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground ml-1">{selectedEmployee.fullName}</span></div>
                  <div><span className="text-muted-foreground">ID:</span> <span className="font-medium text-foreground ml-1">{selectedEmployee.id}</span></div>
                  <div><span className="text-muted-foreground">Designation:</span> <span className="font-medium text-foreground ml-1">{selectedEmployee.designation || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Month:</span> <span className="font-medium text-foreground ml-1">{monthLabel}</span></div>
                </div>

                {/* Basic Salary */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-sm font-semibold text-foreground">Basic Salary</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">LKR {basic.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Allowances */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Additions / Allowances</h4>
                    <Button variant="ghost" size="sm" onClick={() => addItem(setAllowances)} className="h-7 text-xs print:hidden">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right w-48 pr-4">Amount (LKR)</TableHead>
                          <TableHead className="w-10 print:hidden" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allowances.map((a, i) => (
                          <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-muted-foreground text-center font-medium">{i + 1}</TableCell>
                            <TableCell>
                              <Input 
                                value={a.name} 
                                onChange={(e) => updateItem(setAllowances, a.id, "name", e.target.value)} 
                                className="h-9 text-sm border border-input rounded-md px-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
                                placeholder="Enter allowance type" 
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input 
                                type="number" 
                                value={a.amount > 0 ? a.amount : ""} 
                                onChange={(e) => updateItem(setAllowances, a.id, "amount", parseFloat(e.target.value) || 0)} 
                                className="h-9 text-sm text-right border border-input rounded-md px-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all tabular-nums" 
                                placeholder="Amount" 
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell className="print:hidden text-center">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={() => removeItem(setAllowances, a.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/40 font-semibold border-t-2">
                          <TableCell />
                          <TableCell>Total Allowances</TableCell>
                          <TableCell className="text-right pr-4 tabular-nums">LKR {totalAllowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="print:hidden" />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Gross Pay */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-sm font-semibold text-foreground">Gross Pay</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">LKR {grossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Deductions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Deductions</h4>
                    <Button variant="ghost" size="sm" onClick={() => addItem(setDeductions)} className="h-7 text-xs print:hidden">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right w-48 pr-4">Amount (LKR)</TableHead>
                          <TableHead className="w-10 print:hidden" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deductions.map((d, i) => (
                          <TableRow key={d.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-muted-foreground text-center font-medium">{i + 1}</TableCell>
                            <TableCell>
                              <Input 
                                value={d.name} 
                                onChange={(e) => updateItem(setDeductions, d.id, "name", e.target.value)} 
                                className="h-9 text-sm border border-input rounded-md px-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
                                placeholder="Enter deduction type" 
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input 
                                type="number" 
                                value={d.amount > 0 ? d.amount : ""} 
                                onChange={(e) => updateItem(setDeductions, d.id, "amount", parseFloat(e.target.value) || 0)} 
                                className="h-9 text-sm text-right border border-input rounded-md px-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all tabular-nums" 
                                placeholder="Amount" 
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell className="print:hidden text-center">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={() => removeItem(setDeductions, d.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/40 font-semibold border-t-2">
                          <TableCell />
                          <TableCell>Total Deductions</TableCell>
                          <TableCell className="text-right pr-4 tabular-nums">LKR {totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="print:hidden" />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <span className="text-lg font-bold text-foreground">Net Salary</span>
                  <span className="text-lg font-bold text-primary tabular-nums">LKR {netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Signature area */}
                <div className="grid grid-cols-2 gap-12 pt-8 mt-4 border-t border-border print:block">
                  <div className="text-center">
                    <div className="border-b border-border mb-1 pb-8" />
                    <p className="text-xs text-muted-foreground">Prepared By</p>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-border mb-1 pb-8" />
                    <p className="text-xs text-muted-foreground">Authorized Signature</p>
                  </div>
                </div>

                {/* Action Button for Database Submission */}
                <div className="mt-8 flex justify-end print:hidden">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto"
                    disabled={creating}
                    onClick={handleCreatePayroll}
                  >
                    {creating ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit to Director"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!selectedEmployee && !searchError && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Enter Employee ID</h3>
            <p className="text-sm text-muted-foreground">Search by employee ID to auto-populate details and generate the paysheet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
