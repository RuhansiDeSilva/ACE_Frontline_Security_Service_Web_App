package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InvoiceResponse {

    private Integer invoiceId;
    private String invoiceNumber;
    private Integer clientId;
    private String companyName;
    private String clientVatNumber;
    private String serviceLocation;
    private Integer billingMonth;
    private Integer billingYear;
    private LocalDate periodFrom;
    private LocalDate periodTo;
    private LocalDate issueDate;
    private LocalDate dueDate;

    // Invoice calculation breakdown — matches sample invoice exactly
    private Double subtotal;           // OIC total + JSO total
    private Double deductionsTotal;    // Total deductions
    private Double netSubtotal;        // Subtotal − Deductions
    private Double otherCharges;       // Admin/misc charges
    private Double invoiceAmount;      // Net Subtotal + Other Charges (pre-tax)
    private Double ssclAmount;         // 2.5% SSCL
    private Double vatAmount;          // 18% VAT
    private Double totalAmount;        // TOTAL PAYABLE
    private Double paidAmount;
    private Double balanceAmount;
    private Double lateFee;

    private String invoiceType;        // AUTO or MANUAL
    private String status;
    private String notes;
    private String manualReason;
    private String disputeReason;

    private LocalDateTime approvedAt;
    private LocalDateTime issuedAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;

    private List<InvoiceItemResponse> items;
    private List<PaymentResponse> payments;
}