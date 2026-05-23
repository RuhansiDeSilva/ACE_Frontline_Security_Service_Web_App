import { useState, useEffect } from "react";
import { ArrowLeft, Download, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { authService, UserProfile } from "@/services/authService";
import { exportUsersToExcel } from "@/lib/excelExport";

interface UserDirectoryProps {
  onBack?: () => void;
}

export default function UserDirectory({ onBack }: UserDirectoryProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [selectedRole, searchTerm, users]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to load users";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (selectedRole && selectedRole !== "ALL") {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.fullName?.toLowerCase().includes(term) ||
          user.username?.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleExportExcel = () => {
    try {
      exportUsersToExcel(filteredUsers, "User_Directory.xlsx");
      toast.success("Excel file downloaded successfully!");
    } catch (err: any) {
      const errorMsg = err.message || "Failed to export Excel file";
      toast.error(errorMsg);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getAllRoles = () => {
    const roles = new Set(users.map(u => u.role));
    return Array.from(roles).sort();
  };

  return (
    <div className="space-y-6">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Users className="h-5 w-5" />
          </div>
          User Directory
        </h1>
        <p className="text-muted-foreground mt-1">
          View and filter all registered personnel across the organization
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Filter by Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                {getAllRoles().map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Search by Name</Label>
            <Input
              placeholder="Enter name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <Button
              onClick={handleExportExcel}
              disabled={loading || filteredUsers.length === 0}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {users.length === 0 ? "No users found" : "No users match your filters"}
          </p>
        </div>
      )}

      {!loading && filteredUsers.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Date Registered</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName || "N/A"}</TableCell>
                    <TableCell>{user.username || "N/A"}</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {user.role?.replace(/_/g, " ") || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>{user.email || "N/A"}</TableCell>
                    <TableCell>{user.mobileNumber || "N/A"}</TableCell>
                    <TableCell>{formatDate(user.joinDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getDetailColumn(user)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function getDetailColumn(user: UserProfile): string {
  const { role, basicSalary, designation, assignedCompany, assignedArea } = user;

  // Admin roles: show salary
  const adminRoleList = [
    "EXECUTIVE_OFFICER",
    "OPERATION_MANAGER",
    "ACCOUNT_EXECUTIVE",
    "AREA_MANAGER",
    "DIRECTOR",
    "CHAIRMAN",
  ];

  if (adminRoleList.includes(role)) {
    return basicSalary ? `$${basicSalary.toLocaleString()}` : "N/A";
  }

  if (role === "SECURITY_OFFICER") {
    return `${designation || "N/A"} - ${assignedCompany || "N/A"}`;
  }

  if (role === "AREA_MANAGER") {
    return `Area: ${assignedArea || "N/A"}`;
  }

  return "—";
}
