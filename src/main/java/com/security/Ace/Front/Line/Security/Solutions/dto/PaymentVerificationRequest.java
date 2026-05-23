package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentVerificationRequest {

    @NotNull(message = "Payment ID is required")
    private Integer paymentId;

    @NotBlank(message = "Verification status is required (VERIFIED or REJECTED)")
    private String verificationStatus;

    private String rejectionReason;

    private String remarks;
}