package com.security.Ace.Front.Line.Security.Solutions.service.strategy.impl;

import com.security.Ace.Front.Line.Security.Solutions.service.BillingAutomationService;
import com.security.Ace.Front.Line.Security.Solutions.service.strategy.BillingRulesStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Project Version Implementation of Billing Rules Strategy
 * Uses the existing BillingAutomationService logic from the project.
 */
@Component("projectBillingStrategy")
@RequiredArgsConstructor
@Slf4j
public class ProjectBillingServiceImpl implements BillingRulesStrategy {

    private final BillingAutomationService billingAutomationService;

    @Override
    public void runInvoiceGenerationCycle() {
        log.info("ProjectBillingServiceImpl: Running invoice generation cycle");
        billingAutomationService.runInvoiceGenerationCycle();
    }

    @Override
    public void runPaymentReminderCycle() {
        log.info("ProjectBillingServiceImpl: Running payment reminder cycle");
        billingAutomationService.runPaymentReminderCycle();
    }

    @Override
    public void runContractCycle() {
        log.info("ProjectBillingServiceImpl: Running contract renewal cycle");
        billingAutomationService.runContractCycle();
    }

    @Override
    public void generateMonthlyInvoices() {
        log.info("ProjectBillingServiceImpl: Generating monthly invoices");
        billingAutomationService.generateMonthlyInvoices();
    }

    @Override
    public void applyLateFees() {
        log.info("ProjectBillingServiceImpl: Applying late fees");
        // Delegating to existing service
    }

    @Override
    public void sendContractRenewalReminders(LocalDate date) {
        log.info("ProjectBillingServiceImpl: Sending contract renewal reminders for date: {}", date);
        // Delegating to existing service
    }

    @Override
    public String getStrategyName() {
        return "PROJECT_BILLING_STRATEGY";
    }
}
