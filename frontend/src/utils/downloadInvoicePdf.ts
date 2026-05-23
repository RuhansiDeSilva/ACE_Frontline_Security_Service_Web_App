/**
 * Downloads an invoice PDF from the backend and triggers a browser save dialog.
 */
export async function downloadInvoicePdf(
    invoiceId: number,
    invoiceNumber: string
): Promise<void> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `http://localhost:8090/api/pdf/invoice/${invoiceId}`,
        {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to download PDF (${response.status})`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}