package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClientDashboardResponse {

    private Integer clientId;
    private String companyName;
    private String status;
    private Integer activeOfficersCount;
    private Double totalOutstanding;
    private Integer overdueInvoicesCount;
    private Integer pendingPaymentsCount;
    private Double monthlyBaseFee;
    private String riskLevel;
    private String serviceLocation;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private String contractStatus; // ACTIVE / EXPIRING_SOON / EXPIRED
    private Integer entryLevelCount;
    private Integer midLevelCount;
    private Integer specializedCount;
    private Integer supervisorCount;

    private BigDecimal entryLevelRatePerShift;
    private BigDecimal midLevelRatePerShift;
    private BigDecimal specializedRatePerShift;
    private BigDecimal supervisorRatePerShift;

    private BigDecimal otRatePerHour;
    private BigDecimal entryLevelOtRatePerHour;
    private BigDecimal midLevelOtRatePerHour;
    private BigDecimal specializedOtRatePerHour;
    private BigDecimal supervisorOtRatePerHour;

    private String currentInvoiceStatus;
    private Double currentInvoiceAmount;
    private LocalDate nextDueDate;
    private LocalDate lastPaymentDate;
    private Integer daysUntilDue; // countdown shown to client
}