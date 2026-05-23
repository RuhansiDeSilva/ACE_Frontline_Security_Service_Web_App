package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentUploadRequest {

    @NotNull(message = "Invoice ID is required")
    private Integer invoiceId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amountPaid;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    // Per guide: Bank Transfer only (BANK_TRANSFER or CHEQUE)
    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    // Bank client paid from — captured on upload form per guide
    private String bankName;

    private String transactionReference;

    private String remarks;

    @NotNull(message = "Payment proof is required")
    private MultipartFile paymentProof;
}