package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class PaymentResponse {

    private Integer paymentId;
    private Integer invoiceId;
    private String invoiceNumber;
    private Integer clientId;
    private String companyName;
    private Double amountPaid;
    private LocalDate paymentDate;
    private String paymentMethod;
    private String transactionReference;
    private String paymentProofPath;
    private String verificationStatus;
    private String remarks;
    private String rejectionReason;
    private LocalDateTime proofUploadedAt;
    private LocalDateTime verifiedAt;
    private Integer verifiedBy;
    private Double invoiceTotal;
    private LocalDate invoiceDueDate;
}