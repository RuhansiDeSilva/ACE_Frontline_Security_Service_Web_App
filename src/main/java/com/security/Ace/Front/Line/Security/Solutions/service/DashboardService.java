package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.ClientDashboardResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ClientStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ClientFeedbackRepository feedbackRepository;
    private final AssignedOfficerRepository assignedOfficerRepository;

    // ── Admin stats card row ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardStatsResponse getAdminDashboardStats() {
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalActiveClients(clientRepository.countActiveClients());
        stats.setTotalInvoicesThisMonth(invoiceRepository.countInvoicesForMonth(month, year));
        stats.setTotalRevenue(nvl(invoiceRepository.getTotalInvoicedAmountForMonth(month, year)));
        stats.setTotalCollectedThisMonth(nvl(invoiceRepository.getTotalCollectedAmountForMonth(month, year)));
        stats.setTotalOutstanding(nvl(invoiceRepository.getTotalOutstandingAmount()));
        stats.setPendingPaymentVerifications(paymentRepository.countPendingVerifications());
        stats.setOverdueInvoices(invoiceRepository.findOverdueInvoices().size());
        stats.setAverageRating(nvl(feedbackRepository.getOverallAverageRating()));
        stats.setPendingFeedbacks(feedbackRepository.findPendingReview().size());
        stats.setTotalLateFees(nvl(invoiceRepository.getTotalLateFees()));
        stats.setNewClientsThisMonth(clientRepository.countNewClientsInMonth(month, year));
        stats.setExpiringContractsIn30Days(clientRepository.findClientsExpiringSoonNative(30).size());
        stats.setExpiringContractsIn60Days(clientRepository.findClientsExpiringSoonNative(60).size());
        stats.setAveragePaymentTimeDays(nvl(paymentRepository.getAveragePaymentTimeDays()));
        stats.setOverdueClientsCount(clientRepository.findByStatus(ClientStatus.ACTIVE).stream()
                .filter(c -> !invoiceRepository.findOverdueInvoicesByClient(c.getClientId()).isEmpty())
                .count());
        return stats;
    }

    // ── Admin analytics (same stats, can be called with year filter) ─────────

    @Transactional(readOnly = true)
    public DashboardStatsResponse getAdminAnalytics(Integer year) {
        // Reuse same stats — year-specific filtering can be extended later
        return getAdminDashboardStats();
    }

    // ── Upcoming renewals ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Client> getUpcomingRenewals() {
        return clientRepository.findClientsExpiringSoonNative(60);
    }

    // ── Accountant dashboard ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardStatsResponse getAccountantDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setPendingPaymentVerifications(paymentRepository.countPendingVerifications());
        stats.setOverdueInvoices(invoiceRepository.findOverdueInvoices().size());
        stats.setTotalOutstanding(nvl(invoiceRepository.getTotalOutstandingAmount()));
        stats.setTotalLateFees(nvl(invoiceRepository.getTotalLateFees()));
        return stats;
    }

    // ── Client dashboard ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ClientDashboardResponse getClientDashboard(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        long activeOfficers = assignedOfficerRepository.countActiveOfficersForClient(clientId);

        List<Invoice> pendingInvoices = invoiceRepository.findPendingInvoicesByClient(clientId);
        double totalOutstanding = pendingInvoices.stream()
                .mapToDouble(inv -> inv.getBalanceAmount() != null
                        ? inv.getBalanceAmount().doubleValue()
                        : 0.0)
                .sum();

        int overdueCount = invoiceRepository.findOverdueInvoicesByClient(clientId).size();

        // Current invoice = most recent pending
        Invoice currentInvoice = pendingInvoices.stream().findFirst().orElse(null);

        LocalDate nextDueDate = currentInvoice != null ? currentInvoice.getDueDate() : null;
        LocalDate now = LocalDate.now();
        Integer daysUntilDue = (nextDueDate != null && !nextDueDate.isBefore(now))
                ? (int) now.until(nextDueDate, java.time.temporal.ChronoUnit.DAYS)
                : null;

        // Contract status
        LocalDate contractEnd = client.getContractEndDate();
        String contractStatus = "ACTIVE";
        if (contractEnd != null) {
            long daysToExpiry = now.until(contractEnd, java.time.temporal.ChronoUnit.DAYS);
            if (daysToExpiry < 0)
                contractStatus = "EXPIRED";
            else if (daysToExpiry <= 30)
                contractStatus = "EXPIRING_SOON";
        }

        ClientDashboardResponse dash = new ClientDashboardResponse();
        dash.setClientId(client.getClientId());
        dash.setCompanyName(client.getCompanyName());
        dash.setStatus(client.getStatus().toString());
        dash.setServiceLocation(client.getServiceLocation());
        dash.setContractStartDate(client.getServiceStartDate());
        dash.setContractEndDate(contractEnd);
        dash.setContractStatus(contractStatus);
        dash.setEntryLevelCount(client.getEntryLevelCount());
        dash.setMidLevelCount(client.getMidLevelCount());
        dash.setSpecializedCount(client.getSpecializedCount());
        dash.setSupervisorCount(client.getSupervisorCount());

        dash.setEntryLevelRatePerShift(client.getEntryLevelRatePerShift());
        dash.setMidLevelRatePerShift(client.getMidLevelRatePerShift());
        dash.setSpecializedRatePerShift(client.getSpecializedRatePerShift());
        dash.setSupervisorRatePerShift(client.getSupervisorRatePerShift());

        dash.setEntryLevelOtRatePerHour(client.getEntryLevelOtRatePerHour());
        dash.setMidLevelOtRatePerHour(client.getMidLevelOtRatePerHour());
        dash.setSpecializedOtRatePerHour(client.getSpecializedOtRatePerHour());
        dash.setSupervisorOtRatePerHour(client.getSupervisorOtRatePerHour());
        dash.setActiveOfficersCount((int) activeOfficers);
        dash.setRiskLevel(client.getRiskLevel() != null ? client.getRiskLevel().toString() : null);
        dash.setTotalOutstanding(totalOutstanding);
        dash.setOverdueInvoicesCount(overdueCount);
        dash.setPendingPaymentsCount(pendingInvoices.size());
        dash.setCurrentInvoiceStatus(currentInvoice != null ? currentInvoice.getStatus().toString() : null);
        dash.setCurrentInvoiceAmount(currentInvoice != null && currentInvoice.getTotalAmount() != null
                ? currentInvoice.getTotalAmount().doubleValue()
                : null);
        dash.setNextDueDate(nextDueDate);
        dash.setDaysUntilDue(daysUntilDue);

        return dash;
    }

    private Double nvl(Double val) {
        return val != null ? val : 0.0;
    }

    private long nvl(Long val) {
        return val != null ? val : 0L;
    }
}