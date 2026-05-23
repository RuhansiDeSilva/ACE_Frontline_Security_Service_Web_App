export interface Invoice {
  invoiceId: number;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  status: "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED" | "PENDING_VERIFICATION";
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
