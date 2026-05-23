package com.security.Ace.Front.Line.Security.Solutions.entity.enums;

/**
 * Full invoice state machine per AFLSS guide.
 *
 * DRAFT            → Auto-created on 1st of month. Editable by accountant. NOT visible to client.
 * APPROVED         → Accountant reviewed and locked. Still NOT visible to client.
 * ISSUED           → PDF sent to client. Visible in client portal. Due date = 15th.
 * PAYMENT_UPLOADED → Client uploaded payment proof. Awaiting accountant verification.
 * PAYMENT_REJECTED → Proof rejected with reason. Client must re-upload.
 * PAID             → Payment confirmed by accountant. Receipt issued. Late fees cleared.
 * OVERDUE          → Grace period passed (20th). 1.5% late fee applied.
 * DISPUTED         → Flagged by accountant/admin. Late fees frozen pending resolution.
 * WAIVED           → Outstanding amount waived. Reason and amount recorded for audit.
 * CANCELLED        → Invoice voided. Reason required. Cannot be reinstated.
 */
public enum InvoiceStatus {
    DRAFT,
    APPROVED,
    ISSUED,
    PAYMENT_UPLOADED,
    PAYMENT_REJECTED,
    PAID,
    OVERDUE,
    DISPUTED,
    WAIVED,
    CANCELLED
}