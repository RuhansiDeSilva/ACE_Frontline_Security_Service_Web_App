package com.security.Ace.Front.Line.Security.Solutions.entity.enums;

/**
 * Email types matching the 9 branded templates defined in the AFLSS guide.
 */
public enum EmailType {
    CREDENTIALS, // Welcome email with temporary login credentials
    INVOICE_ISSUED, // Invoice PDF attached, amount, due date, bank details
    PAYMENT_REMINDER, // 10th & 14th of month — days remaining notice
    OVERDUE_NOTICE, // 20th of month — late fee applied, urgent tone
    PAYMENT_VERIFIED, // Payment confirmed — receipt attached
    PAYMENT_REJECTED, // Proof rejected — instructions to re-upload
    FEEDBACK_APPROVED, // Testimonial published on homepage
    CONTRACT_RENEWAL, // 60/30/7 days before expiry
    CONTRACT_EXPIRED, // Account suspended — contact to renew
    AI_RISK_ASSESSMENT // AI Risk Assessment report attached
}