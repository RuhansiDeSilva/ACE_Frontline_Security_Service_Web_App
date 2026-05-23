import { Paysheet } from "@/services/paysheetService";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Export paysheet to PDF in receipt-style format
 */
export async function exportPaysheetToPDF(paysheet: Paysheet): Promise<void> {
  const element = document.createElement("div");
  element.innerHTML = `
    <div style="width: 200mm; padding: 20px; font-family: Arial, sans-serif; background: white; color: black;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: bold;">ACE FRONTLINE SECURITY</h2>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Paysheet Receipt</p>
      </div>

      <div style="margin-bottom: 20px; font-size: 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding: 5px 0;"><strong>Employee Name:</strong></td>
            <td style="width: 50%; text-align: right; padding: 5px 0;">${paysheet.user.fullName}</td>
          </tr>
          <tr>
            <td><strong>Employee ID:</strong></td>
            <td style="text-align: right;">${paysheet.user.id}</td>
          </tr>
          <tr>
            <td><strong>Role:</strong></td>
            <td style="text-align: right;">${paysheet.user.role || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Pay Month:</strong></td>
            <td style="text-align: right;">${formatPayMonth(paysheet.month)}</td>
          </tr>
          <tr style="border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;">
            <td style="padding-top: 10px;"><strong>Generated Date:</strong></td>
            <td style="text-align: right; padding-top: 10px;">${new Date(paysheet.createdAt).toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px; font-size: 12px;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold;">Salary Breakdown</h4>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <tr style="background: #f5f5f5; border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold; width: 70%;">Description</td>
            <td style="padding: 8px; font-weight: bold; text-align: right; width: 30%;">Amount (LKR)</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">Basic Salary</td>
            <td style="padding: 8px; text-align: right;">${paysheet.basicSalary.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">Allowances</td>
            <td style="padding: 8px; text-align: right;">${paysheet.allowances.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">Loan Deduction</td>
            <td style="padding: 8px; text-align: right;">-${paysheet.loanDeduction.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">Advance Deduction</td>
            <td style="padding: 8px; text-align: right;">-${paysheet.advanceDeduction.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 2px solid #333; background: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; font-size: 13px;">Other Deductions</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 13px;">-${(paysheet.deductions - paysheet.loanDeduction - paysheet.advanceDeduction).toLocaleString()}</td>
          </tr>
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px; font-weight: bold; font-size: 14px;">NET SALARY</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 14px; color: #2d5016;">LKR ${paysheet.netSalary.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px;">
        <p>This is an automatically generated paysheet. For inquiries, contact HR.</p>
        <p style="margin: 0;">Generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;

  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, { backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    const fileName = `Paysheet_${paysheet.user.fullName}_${paysheet.month}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(element);
  }
}

/**
 * Export paysheet to Excel format
 */
export function exportPaysheetToExcel(paysheets: Paysheet[]): void {
  const workbook = XLSX.utils.book_new();

  // Detailed sheet
  const detailedData = paysheets.map((ps) => ({
    "Employee Name": ps.user.fullName,
    "Employee ID": ps.user.id,
    "Role": ps.user.role || "N/A",
    "Pay Month": formatPayMonth(ps.month),
    "Basic Salary": ps.basicSalary,
    "Allowances": ps.allowances,
    "Loan Deduction": ps.loanDeduction,
    "Advance Deduction": ps.advanceDeduction,
    "Other Deductions": ps.deductions - ps.loanDeduction - ps.advanceDeduction,
    "Net Salary": ps.netSalary,
    "Status": ps.id ? "Completed" : "Pending",
    "Generated Date": new Date(ps.createdAt).toLocaleDateString(),
  }));

  const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(workbook, detailedSheet, "Paysheets");

  // Summary sheet
  if (paysheets.length > 0) {
    const summaryData = [
      { Metric: "Total Paysheets", Value: paysheets.length },
      { Metric: "Total Basic Salary", Value: paysheets.reduce((s, p) => s + p.basicSalary, 0) },
      { Metric: "Total Allowances", Value: paysheets.reduce((s, p) => s + p.allowances, 0) },
      { Metric: "Total Deductions", Value: paysheets.reduce((s, p) => s + p.deductions, 0) },
      { Metric: "Total Net Salary", Value: paysheets.reduce((s, p) => s + p.netSalary, 0) },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  }

  const fileName = `Paysheet_History_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Format pay month from YYYY-MM to Month Year
 */
function formatPayMonth(month: string): string {
  try {
    const [year, monthNum] = month.split("-");
    const date = new Date(Number(year), Number(monthNum) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return month;
  }
}
