package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DeductionResponse {

    private Integer deductionId;
    private Integer clientId;
    private String companyName;
    private String deductionType;
    private BigDecimal amount;
    private LocalDate incidentDate;
    private String description;
    private Integer officerId;
    private String officerName;
    private Integer targetBillingMonth;
    private Integer targetBillingYear;
    private Integer invoiceId;
    private String invoiceNumber;
    private boolean appliedToInvoice;
    private boolean queuedForNextMonth;
    private String accountantApprovalStatus;
    private String accountantRejectionReason;
    private LocalDateTime createdAt;
}