import * as XLSX from "xlsx";
import { UserProfile } from "@/services/authService";

export function exportUsersToExcel(users: UserProfile[], filename: string) {
  // Prepare data for Excel
  const data = users.map((user) => ({
    "Full Name": user.fullName || "N/A",
    "Username": user.username || "N/A",
    "Role": user.role?.replace(/_/g, " ") || "N/A",
    "Email": user.email || "N/A",
    "Mobile Number": user.mobileNumber || "N/A",
    "Date Registered": user.joinDate ? formatDate(user.joinDate) : "N/A",
    "Salary": user.basicSalary ? `$${user.basicSalary.toLocaleString()}` : "N/A",
    "Designation": user.designation || "N/A",
    "Assigned Company": user.assignedCompany || "N/A",
    "Assigned Area": user.assignedArea || "N/A",
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-adjust column widths
  const columnWidths = [
    { wch: 20 }, // Full Name
    { wch: 15 }, // Username
    { wch: 20 }, // Role
    { wch: 25 }, // Email
    { wch: 15 }, // Mobile
    { wch: 15 }, // Date Registered
    { wch: 12 }, // Salary
    { wch: 15 }, // Designation
    { wch: 15 }, // Company
    { wch: 15 }, // Area
  ];
  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  // Generate Excel file
  XLSX.writeFile(workbook, filename);
}

function formatDate(dateString: string): string {
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
}
