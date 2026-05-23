package com.security.Ace.Front.Line.Security.Solutions.service.strategy;

import java.time.LocalDate;

/**
 * Strategy interface for billing automation rules.
 * Allows different billing automation implementations (Project vs Source) to coexist.
 */
public interface BillingRulesStrategy {

    /**
     * Run monthly invoice generation cycle
     */
    void runInvoiceGenerationCycle();

    /**
     * Run payment reminder cycle
     */
    void runPaymentReminderCycle();

    /**
     * Run contract renewal cycle
     */
    void runContractCycle();

    /**
     * Generate monthly invoices for a specific month/year
     */
    void generateMonthlyInvoices();

    /**
     * Apply late fees and send overdue notices
     */
    void applyLateFees();

    /**
     * Send contract renewal reminders
     */
    void sendContractRenewalReminders(LocalDate date);

    /**
     * Get strategy name for logging/debugging
     */
    String getStrategyName();
}
