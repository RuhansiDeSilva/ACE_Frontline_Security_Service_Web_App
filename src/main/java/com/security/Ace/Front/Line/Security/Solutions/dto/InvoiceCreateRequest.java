package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class InvoiceCreateRequest {

    @NotNull(message = "Client ID is required")
    private Integer clientId;

    @NotNull(message = "Billing month is required")
    private Integer billingMonth;

    @NotNull(message = "Billing year is required")
    private Integer billingYear;

    @NotNull(message = "Period from date is required")
    private LocalDate periodFrom;

    @NotNull(message = "Period to date is required")
    private LocalDate periodTo;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    // AUTO (default) or MANUAL
    private String invoiceType;

    // Required when invoiceType = MANUAL — audit trail
    private String manualReason;

    private String notes;

    private List<InvoiceItemRequest> items;
}