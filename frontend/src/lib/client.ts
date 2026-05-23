export type ClientStatus = "ACTIVE" | "SUSPENDED" | "TERMINATED" | "EXPIRED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Client {
    clientId: number;
    clientCode: string;
    companyName: string;
    companyRegistrationNo: string;
    vatNumber?: string;
    industryType: string;
    address: string;
    serviceLocation?: string;
    city: string;
    contactPersonName: string;
    contactPersonDesignation?: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    username: string;
    serviceStartDate: string;
    contractDurationMonths: number;
    contractEndDate?: string;
    entryLevelCount?: number;
    midLevelCount?: number;
    specializedCount?: number;
    supervisorCount?: number;

    entryLevelRatePerShift?: number;
    midLevelRatePerShift?: number;
    specializedRatePerShift?: number;
    supervisorRatePerShift?: number;

    otRatePerHour?: number;
    entryLevelOtRatePerHour?: number;
    midLevelOtRatePerHour?: number;
    specializedOtRatePerHour?: number;
    supervisorOtRatePerHour?: number;

    recommendedOfficers: number;
    activeOfficersCount: number;
    totalOutstanding: number;
    riskLevel?: RiskLevel;
    status: ClientStatus;
    registeredAt: string;
    updatedAt: string;
}

export interface ClientRegistrationRequest {
    companyName: string;
    companyRegistrationNo: string;
    vatNumber?: string;
    industryType: string;
    address: string;
    serviceLocation?: string;
    city: string;
    contactPersonName: string;
    contactPersonDesignation?: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    serviceStartDate: string;
    contractDurationMonths: number;
    entryLevelCount?: number;
    midLevelCount?: number;
    specializedCount?: number;
    supervisorCount?: number;

    entryLevelRatePerShift?: number;
    midLevelRatePerShift?: number;
    specializedRatePerShift?: number;
    supervisorRatePerShift?: number;

    otRatePerHour?: number;
    entryLevelOtRatePerHour?: number;
    midLevelOtRatePerHour?: number;
    specializedOtRatePerHour?: number;
    supervisorOtRatePerHour?: number;

    riskLevel?: string;
    recommendedOfficers?: number;
}

export interface ClientDashboardData {
    clientId: number;
    companyName: string;
    status: string;
    activeOfficersCount: number;
    totalOutstanding: number;
    overdueInvoicesCount: number;
    pendingPaymentsCount: number;
    monthlyBaseFee: number;
    riskLevel: string;
    serviceLocation?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    contractStatus?: string;
    entryLevelCount?: number;
    midLevelCount?: number;
    specializedCount?: number;
    supervisorCount?: number;

    currentInvoiceStatus?: string;
    currentInvoiceAmount?: number;
    nextDueDate?: string;
    lastPaymentDate?: string;
    daysUntilDue?: number;
}

/** Matches backend InvoiceResponse DTO */
export interface Invoice {
    invoiceId: number;
    invoiceNumber: string;
    clientId?: number;
    companyName?: string;
    clientVatNumber?: string;
    serviceLocation?: string;
    billingMonth?: number;
    billingYear?: number;
    periodFrom?: string;
    periodTo?: string;
    issueDate?: string;
    dueDate?: string;
    subtotal?: number;
    deductionsTotal?: number;
    netSubtotal?: number;
    otherCharges?: number;
    invoiceAmount?: number;
    ssclAmount?: number;
    vatAmount?: number;
    totalAmount?: number;
    paidAmount?: number;
    balanceAmount?: number;
    lateFee?: number;
    invoiceType?: string;
    status: string;
    notes?: string;
    manualReason?: string;
    disputeReason?: string;
    approvedAt?: string;
    issuedAt?: string;
    verifiedAt?: string;
    createdAt?: string;
    items?: InvoiceItem[];
    payments?: PaymentRecord[];
}

/** Matches backend InvoiceItemResponse DTO */
export interface InvoiceItem {
    itemId?: number;
    itemType?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
    taxPercentage?: number;
}

/** Matches backend PaymentResponse DTO */
export interface PaymentRecord {
    paymentId?: number;
    invoiceId?: number;
    invoiceNumber?: string;
    clientId?: number;
    companyName?: string;
    amountPaid?: number;
    paymentDate?: string;
    paymentMethod?: string;
    transactionReference?: string;
    paymentProofPath?: string;
    verificationStatus?: string;
    remarks?: string;
    rejectionReason?: string;
    proofUploadedAt?: string;
    verifiedAt?: string;
    verifiedBy?: number;
}

export interface OfficerAssignment {
    assignmentId: number;
    clientId: number;
    companyName: string;
    officerId: number;
    officerName: string;
    officerRank?: "OIC" | "JSO" | string;
    shiftType: string;
    assignedFrom?: string;
    assignedTo?: string;
    active?: boolean;
    location?: string;
    duties?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface SuccessData {
    companyName: string;
    username: string;
    temporaryPassword?: string;
    contactPersonEmail: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface Feedback {
    feedbackId: number;
    clientId: number;
    companyName: string;
    overallRating: number;
    officerConductRating?: number;
    responseTimeRating?: number;
    communicationRating?: number;
    comments: string;
    improvements?: string;
    isAnonymous: boolean;
    submissionMonth: number;
    submissionYear: number;
    status: string;
    isApproved: boolean;
    displayOnHomepage: boolean;
    adminResponse?: string;
    createdAt: string;
    reviewedAt?: string;
}

export interface Deduction {
    deductionId: number;
    clientId: number;
    companyName: string;
    deductionType: string;
    amount: number;
    incidentDate: string;
    description: string;
    officerId?: number;
    officerName?: string;
    targetBillingMonth: number;
    targetBillingYear: number;
    invoiceId?: number;
    invoiceNumber?: string;
    appliedToInvoice: boolean;
    queuedForNextMonth: boolean;
    accountantApprovalStatus: string;
    accountantRejectionReason?: string;
    createdAt: string;
}
