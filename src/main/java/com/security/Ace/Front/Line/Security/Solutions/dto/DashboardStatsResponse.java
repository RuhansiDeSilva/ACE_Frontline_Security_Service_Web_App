package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {

    // Core stats
    private long totalActiveClients;
    private long totalInvoicesThisMonth;
    private Double totalRevenue;
    private Double totalOutstanding;
    private long pendingPaymentVerifications;
    private long overdueInvoices;
    private Double averageRating;
    private long pendingFeedbacks;

    // Admin Analytics Dashboard widgets — Phase guide
    private Double totalCollectedThisMonth;
    private Double totalInvoicedThisMonth;
    private long expiringContractsIn30Days;
    private long expiringContractsIn60Days;
    private long newClientsThisMonth;
    private Double averagePaymentTimeDays;    // Avg days from issued to paid
    private Double clientRetentionRate;       // % renewed in last 12 months
    private long overdueClientsCount;
    private Double totalLateFees;
    private long totalSuspendedClients;
}