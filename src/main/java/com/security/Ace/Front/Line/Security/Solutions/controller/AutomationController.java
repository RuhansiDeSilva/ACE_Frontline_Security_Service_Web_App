package com.security.Ace.Front.Line.Security.Solutions.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.security.Ace.Front.Line.Security.Solutions.service.BillingAutomationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/automation")
@RequiredArgsConstructor
public class AutomationController {

    private final BillingAutomationService billingAutomationService;

    @PostMapping("/generate-invoices")
    public ResponseEntity<String> generateInvoices() {
        billingAutomationService.generateMonthlyInvoices();
        return ResponseEntity.ok("Invoice generation triggered successfully.");
    }

    @PostMapping("/send-payment-reminders")
    public ResponseEntity<String> sendPaymentReminders() {
        billingAutomationService.runPaymentReminderCycle();
        return ResponseEntity.ok("Payment reminders sent successfully.");
    }

    @PostMapping("/send-contract-reminders")
    public ResponseEntity<String> sendContractReminders() {
        billingAutomationService.runContractCycle();
        return ResponseEntity.ok("Contract reminders sent successfully.");
    }

    @PostMapping("/send-overdue-notices")
    public ResponseEntity<String> sendOverdueNotices() {
        billingAutomationService.applyLateFeesAndSendOverdueNotices();
        return ResponseEntity.ok("Overdue notices sent successfully.");
    }

    @PostMapping("/handle-expired-contracts")
    public ResponseEntity<String> handleExpiredContracts() {
        billingAutomationService.markExpiredContractsAndNotify();
        return ResponseEntity.ok("Expired contracts handled successfully.");
    }
    
}
