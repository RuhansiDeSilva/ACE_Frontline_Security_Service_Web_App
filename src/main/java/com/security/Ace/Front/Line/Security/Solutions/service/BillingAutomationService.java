package com.security.Ace.Front.Line.Security.Solutions.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ClientStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.EmailType;
import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.EmailLogRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InvoiceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingAutomationService {

    private final InvoiceService invoiceService;

    private static final BigDecimal LATE_FEE_RATE = new BigDecimal("0.015");
    private static final Set<Long> RENEWAL_REMINDER_DAYS = Set.of(60L, 30L, 7L);
    private static final Set<Long> PAYMENT_REMINDER_DAYS = Set.of(7L, 3L, 1L);

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final EmailLogRepository emailLogRepository;
    private final EmailService emailService;

    @Scheduled(cron = "${app.jobs.invoice-generation-cron:0 0 8 1 * *}", zone = "${app.jobs.timezone:Asia/Colombo}")
    @Transactional
    public void runInvoiceGenerationCycle() {
        LocalDate today = LocalDate.now();
        if (today.getDayOfMonth() == 1) {
            generateMonthlyInvoices();
        }
    }

    @Scheduled(cron = "${app.jobs.payment-reminders-cron:0 0 9 * * *}", zone = "${app.jobs.timezone:Asia/Colombo}")
    @Transactional
    public void runPaymentReminderCycle() {
        LocalDate today = LocalDate.now();

        sendUpcomingPaymentReminders(today);
        applyLateFeesAndSendOverdueNotices();
    }

    @Scheduled(cron = "${app.jobs.contracts-cron:0 30 9 * * *}", zone = "${app.jobs.timezone:Asia/Colombo}")
    @Transactional
    public void runContractCycle() {
        LocalDate today = LocalDate.now();

        sendContractRenewalReminders(today);
        markExpiredContractsAndNotify();
    }

    public void generateMonthlyInvoices() {
        LocalDate today = LocalDate.now();
        invoiceService.generateMonthlyInvoices(today.getMonthValue(), today.getYear());
        log.info("Manual invoice generation triggered for {}/{}", today.getMonthValue(), today.getYear());
    }

    private void sendUpcomingPaymentReminders(LocalDate today) {
        List<Invoice> candidates = invoiceRepository.findInvoicesForReminderWindow(today, today.plusDays(7));
        for (Invoice invoice : candidates) {
            if (invoice.getDueDate() == null || invoice.getBalanceAmount() == null
                    || invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            long daysRemaining = ChronoUnit.DAYS.between(today, invoice.getDueDate());
            if (!PAYMENT_REMINDER_DAYS.contains(daysRemaining)) {
                continue;
            }

            if (hasSentToday(EmailType.PAYMENT_REMINDER, invoice.getInvoiceId())) {
                continue;
            }

            emailService.sendPaymentReminderEmail(invoice.getClient(), invoice, (int) daysRemaining);
            log.info("Payment reminder sent for invoice {} ({} days remaining)",
                    invoice.getInvoiceNumber(), daysRemaining);
        }
    }

    public void applyLateFeesAndSendOverdueNotices() {
        List<Invoice> overdueCandidates = invoiceRepository.findInvoicesEligibleForLateFee();

        for (Invoice invoice : overdueCandidates) {
            if (invoice == null || invoice.getClient() == null) {
                continue;
            }

            BigDecimal baseOutstanding = invoice.getBalanceAmount() != null
                    ? invoice.getBalanceAmount()
                    : BigDecimal.ZERO;

            if (baseOutstanding.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal lateFee = baseOutstanding.multiply(LATE_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
            if (lateFee.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            invoice.setLateFee((invoice.getLateFee() == null ? BigDecimal.ZERO : invoice.getLateFee()).add(lateFee));
            invoice.setLateFeeApplied(true);
            invoice.setStatus(InvoiceStatus.OVERDUE);
            invoice.setTotalAmount((invoice.getTotalAmount() == null ? BigDecimal.ZERO : invoice.getTotalAmount()).add(lateFee));
            invoice.setBalanceAmount((invoice.getBalanceAmount() == null ? BigDecimal.ZERO : invoice.getBalanceAmount()).add(lateFee));
            invoiceRepository.save(invoice);

            if (!hasSentToday(EmailType.OVERDUE_NOTICE, invoice.getInvoiceId())) {
                try {
                    if (invoice.getClient().getContactPersonEmail() == null
                            || invoice.getClient().getContactPersonEmail().isBlank()) {
                        log.warn("Skipping overdue email: client has no email (invoiceId={}, clientId={})",
                                invoice.getInvoiceId(), invoice.getClient().getClientId());
                    } else {
                        emailService.sendOverdueNoticeEmail(invoice.getClient(), invoice);
                    }
                } catch (Exception e) {
                    log.error("Failed sending overdue notice (invoiceId={}, clientId={})",
                            invoice.getInvoiceId(), invoice.getClient().getClientId(), e);
                }
            }

            log.info("Late fee applied to invoice {} (+{})", invoice.getInvoiceNumber(), lateFee);
        }
    }

    private void sendContractRenewalReminders(LocalDate today) {
        List<Client> activeClients = clientRepository.findByStatus(ClientStatus.ACTIVE);

        for (Client client : activeClients) {
            LocalDate contractEnd = client.getContractEndDate();
            if (contractEnd == null) {
                continue;
            }

            long daysToExpiry = ChronoUnit.DAYS.between(today, contractEnd);
            if (!RENEWAL_REMINDER_DAYS.contains(daysToExpiry)) {
                continue;
            }

            if (hasSentToday(EmailType.CONTRACT_RENEWAL, client.getClientId())) {
                continue;
            }

            emailService.sendContractRenewalEmail(client, daysToExpiry);
            log.info("Contract renewal reminder sent for client {} ({} days remaining)",
                    client.getCompanyName(), daysToExpiry);
        }
    }

    public void markExpiredContractsAndNotify() {
        List<Client> expiredActiveContracts = clientRepository.findContractsAlreadyExpired();

        for (Client client : expiredActiveContracts) {
            if (client == null) {
                continue;
            }

            try {
                client.setStatus(ClientStatus.EXPIRED);
                clientRepository.save(client);
            } catch (Exception e) {
                log.error("Failed marking client as EXPIRED (clientId={})", client.getClientId(), e);
                continue;
            }

            try {
                if (!hasSentToday(EmailType.CONTRACT_EXPIRED, client.getClientId())) {
                    if (client.getContactPersonEmail() == null || client.getContactPersonEmail().isBlank()) {
                        log.warn("Skipping contract expired email: client has no email (clientId={})",
                                client.getClientId());
                    } else {
                        emailService.sendContractExpiredEmail(client);
                    }
                }
            } catch (Exception e) {
                log.error("Failed sending contract expired email (clientId={})", client.getClientId(), e);
            }

            log.info("Client marked as EXPIRED: {} (clientId={})", client.getCompanyName(), client.getClientId());
        }
    }

    private boolean hasSentToday(EmailType type, Integer relatedId) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(23, 59, 59);
        return emailLogRepository.existsSentEmailForDay(type, relatedId, start, end);
    }
}
