package com.security.Ace.Front.Line.Security.Solutions.entity.enums;

/**
 * Payroll/Paysheet Status Enumeration
 */
public enum PayrollStatus {
    PENDING("Pending"),
    IN_PROGRESS("In Progress"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    PAID("Paid"),
    PARTIALLY_PAID("Partially Paid"),
    OVERDUE("Overdue"),
    CANCELLED("Cancelled"),
    DRAFT("Draft"),
    SUBMITTED_TO_DIRECTOR("Submitted to Director"),
    APPROVED_BY_DIRECTOR("Approved by Director"),
    REJECTED_BY_DIRECTOR("Rejected by Director"),
    SENT_TO_BANK("Sent to Bank");

    private final String displayValue;

    PayrollStatus(String displayValue) {
        this.displayValue = displayValue;
    }

    public String getDisplayValue() {
        return displayValue;
    }
}
