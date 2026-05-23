import {
    Client, ClientRegistrationRequest, ClientDashboardData,
    Invoice, PaymentRecord, Feedback, Deduction, OfficerAssignment
} from "./client";

export const API_BASE = "http://localhost:8090/api";

function getHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...getHeaders(), ...options?.headers },
    });
    const json = await res.json();
    if (!res.ok) {
        const error = new Error(json.message || `Request failed (${res.status})`) as any;
        error.status = res.status;
        error.validationErrors = json.validationErrors;
        throw error;
    }
    return json.data;
}

// Public endpoints: do NOT attach bearer token.
// This avoids 401 responses when a stale/expired token exists in localStorage.
export async function apiFetchPublic<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
    return json.data;
}

export const clientApi = {
    getAll: () => apiFetch<Client[]>("/clients"),
    getActive: () => apiFetch<Client[]>("/clients/active"),
    getExpiringSoon: (days = 60) => apiFetch<Client[]>(`/clients/expiring-soon?withinDays=${days}`),
    getById: (id: number) => apiFetch<Client>(`/clients/${id}`),
    register: (data: ClientRegistrationRequest) => apiFetch<Client>("/clients/register", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Client>) => apiFetch<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    suspend: (id: number) => apiFetch<Client>(`/clients/${id}/suspend`, { method: "PUT" }),
    terminate: (id: number) => apiFetch<Client>(`/clients/${id}/terminate`, { method: "PUT" }),
    reactivate: (id: number) => apiFetch<Client>(`/clients/${id}/reactivate`, { method: "PUT" }),
    renew: (id: number, months: number) => apiFetch<Client>(`/clients/${id}/renew?additionalMonths=${months}`, { method: "PUT" }),
    changePassword: (id: number, data: any) => apiFetch<any>(`/clients/${id}/change-password`, { method: "PUT", body: JSON.stringify(data) }),
    getDashboard: (id: number) => apiFetch<ClientDashboardData>(`/dashboard/client/${id}`),
    getInvoices: (clientId: number) => apiFetch<Invoice[]>(`/invoices/client/${clientId}`),
    uploadPaymentProof: async (formData: FormData): Promise<any> => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/payments`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || `Upload failed (${res.status})`);
        return json.data;
    },
    submitFeedback: (clientId: number, data: any) => apiFetch<any>(`/feedback/client/${clientId}`, { method: "POST", body: JSON.stringify(data) }),
    getFeedback: (clientId: number) => apiFetch<any[]>(`/feedback/client/${clientId}`),
};

export const feedbackApi = {
    /** Client: submit feedback */
    submit: (clientId: number, data: any) => apiFetch<Feedback>(`/feedback/client/${clientId}`, { method: "POST", body: JSON.stringify(data) }),
    /** Client: get own feedback history */
    getByClient: (clientId: number) => apiFetch<Feedback[]>(`/feedback/client/${clientId}`),
    /** Public: get top 6 approved homepage testimonials */
    getHomepage: () => apiFetchPublic<Feedback[]>("/feedback/homepage"),
    /** Public: get ALL approved feedback (for "see more" page) */
    getApproved: () => apiFetchPublic<Feedback[]>("/feedback/approved"),
    /** Admin/OM: get all feedback */
    getAll: () => apiFetch<Feedback[]>("/feedback"),
    /** Admin/OM: get pending feedback */
    getPending: () => apiFetch<Feedback[]>("/feedback/pending"),
    /** Admin/OM: approve feedback */
    approve: (id: number, displayOnHomepage: boolean) =>
        apiFetch<Feedback>(`/feedback/${id}/approve?displayOnHomepage=${displayOnHomepage}`, { method: "PUT" }),
    /** Admin/OM: reject feedback */
    reject: (id: number, adminResponse?: string) =>
        apiFetch<Feedback>(`/feedback/${id}/reject`, { method: "PUT", body: JSON.stringify({ adminResponse }) }),
    /** Admin/OM: flag feedback as inappropriate */
    flag: (id: number, adminResponse?: string) =>
        apiFetch<Feedback>(`/feedback/${id}/flag`, { method: "PUT", body: JSON.stringify({ adminResponse }) }),
    /** Admin/OM: reply to a feedback submission */
    reply: (id: number, replyMessage: string) =>
        apiFetch<Feedback>(`/feedback/${id}/reply`, { method: "PUT", body: JSON.stringify({ replyMessage }) }),
    /** Admin/OM: download PDF report */
    downloadReport: async (): Promise<void> => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/feedback/report`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Report download failed (${res.status})`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `feedback-report-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    },
};

export const invoiceApi = {
    getAll: (params?: string) => apiFetch<Invoice[]>(`/invoices${params ? "?" + params : ""}`),
    getById: (id: number) => apiFetch<Invoice>(`/invoices/${id}`),
    getByClient: (clientId: number) => apiFetch<Invoice[]>(`/invoices/client/${clientId}`),
    /** Returns DRAFT invoices for the review queue */
    getQueue: (period?: string) => apiFetch<Invoice[]>(`/invoices/queue${period ? "?period=" + period : ""}`),
    getDraft: () => apiFetch<Invoice[]>("/invoices/draft"),
    /** Approve a DRAFT invoice → moves to APPROVED */
    approve: (id: number) => apiFetch<Invoice>(`/invoices/${id}/approve`, { method: "PUT" }),
    /** Issue an APPROVED invoice → moves to ISSUED and emails client */
    issue: (id: number) => apiFetch<Invoice>(`/invoices/${id}/issue`, { method: "PUT" }),
    /** Approve + Issue a batch of DRAFT invoices */
    approveBatch: (ids: number[]) => apiFetch<any>("/invoices/approve-batch", { method: "PUT", body: JSON.stringify({ ids }) }),
    update: (id: number, data: any) => apiFetch<any>(`/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    updateNotes: (id: number, notes: string) => apiFetch<any>(`/invoices/${id}/notes`, { method: "PUT", body: JSON.stringify({ notes }) }),
    deleteDraft: (id: number) => apiFetch<any>(`/invoices/${id}`, { method: "DELETE" }),
    downloadPdf: async (id: number): Promise<Blob> => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/pdf/invoice/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`PDF download failed (${res.status})`);
        return res.blob();
    },
    downloadPdfUrl: (id: number) => `${API_BASE}/pdf/invoice/${id}`,
    /** Create a manual invoice (DRAFT) */
    createManual: (data: any) => apiFetch<any>("/invoices/manual", { method: "POST", body: JSON.stringify(data) }),
    /** Generate monthly invoices for all active clients */
    generateMonthly: (month: number, year: number) =>
        apiFetch<any>(`/invoices/generate-monthly?month=${month}&year=${year}`, { method: "POST" }),
    /** Alias kept for backward compat — calls /issue */
    send: (id: number) => apiFetch<any>(`/invoices/${id}/issue`, { method: "PUT" }),
    exportExcel: () => apiFetch<any>("/invoices/export/excel"),
    getByIdForClient: (invoiceId: number) => apiFetch<any>(`/invoices/${invoiceId}`),
};

export const paymentApi = {
    /** Client: Upload payment proof for an invoice */
    upload: async (formData: FormData): Promise<PaymentRecord> => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/payments`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || `Upload failed (${res.status})`);
        return json.data;
    },
    /** Get all payments for a client */
    getByClient: (clientId: number) => apiFetch<PaymentRecord[]>(`/payments/client/${clientId}`),
    /** Get all payments for an invoice */
    getByInvoice: (invoiceId: number) => apiFetch<PaymentRecord[]>(`/payments/invoice/${invoiceId}`),
    /** Get a single payment by ID */
    getById: (paymentId: number) => apiFetch<PaymentRecord>(`/payments/${paymentId}`),
    /** Accountant: Get all pending payments awaiting verification */
    getPending: () => apiFetch<PaymentRecord[]>("/payments/pending"),
    /** Accountant: Get full payment ledger */
    getAll: () => apiFetch<PaymentRecord[]>("/payments"),
    /** Accountant: Verify (approve or reject) a payment */
    verify: (data: { paymentId: number; verificationStatus: string; rejectionReason?: string; remarks?: string }) =>
        apiFetch<PaymentRecord>("/payments/verify", { method: "PUT", body: JSON.stringify(data) }),
    /** URL to serve the payment proof file inline */
    proofUrl: (paymentId: number) => `${API_BASE}/payments/${paymentId}/proof`,
    /** Download receipt PDF for a verified payment */
    downloadReceipt: async (paymentId: number, invoiceNumber: string): Promise<void> => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/payments/${paymentId}/receipt`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
            const errorBody = await res.text();
            console.error("Receipt download failed:", res.status, errorBody);
            throw new Error(`Receipt download failed (${res.status})`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};

export const deductionApi = {
    /** Create a new deduction record */
    create: (data: {
        clientId: number;
        deductionType: string;
        amount: number;
        incidentDate: string;      // "YYYY-MM-DD"
        description: string;
        officerName?: string;
        targetBillingMonth: number;
        targetBillingYear: number;
    }) => apiFetch<Deduction>("/deductions", { method: "POST", body: JSON.stringify(data) }),

    /** Get all deductions */
    getAll: () => apiFetch<Deduction[]>("/deductions"),

    /** Get a single deduction by ID */
    getById: (id: number) => apiFetch<Deduction>(`/deductions/${id}`),

    /** Get all deductions for a specific client */
    getByClient: (clientId: number) => apiFetch<Deduction[]>(`/deductions/client/${clientId}`),

    /** Get unapplied deductions for a client */
    getUnapplied: (clientId: number) => apiFetch<Deduction[]>(`/deductions/client/${clientId}/unapplied`),

    /** Get total unapplied amount for a client */
    getTotalUnapplied: (clientId: number) => apiFetch<number>(`/deductions/client/${clientId}/total-unapplied`),

    /** Get deductions pending accountant approval */
    getPendingApproval: () => apiFetch<Deduction[]>("/deductions/pending-approval"),

    /** Accountant: Approve a deduction */
    approve: (id: number) => apiFetch<Deduction>(`/deductions/${id}/approve`, { method: "PUT" }),

    /** Accountant: Reject a deduction with a reason */
    reject: (id: number, reason: string) =>
        apiFetch<Deduction>(`/deductions/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) }),

    /** Delete a deduction (only allowed if not yet applied to invoice) */
    delete: (id: number) => apiFetch<Deduction>(`/deductions/${id}`, { method: "DELETE" }),
};

export const officerAssignmentApi = {
    getByClient: (clientId: number) => apiFetch<OfficerAssignment[]>(`/officer-assignments/client/${clientId}`),
    getActiveByClient: (clientId: number) => apiFetch<OfficerAssignment[]>(`/officer-assignments/client/${clientId}/active`),
};
