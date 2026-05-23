package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;

/**
 * Request DTO for creating a manual invoice from the accountant portal.
 * Derives billingMonth/billingYear from periodFrom automatically.
 */
@Data
public class ManualInvoiceCreateRequest {

    private Integer clientId;

    /** "REGULAR" or "ONE_TIME" — both produce InvoiceType.MANUAL */
    private String billingType;

    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate periodFrom;
    private LocalDate periodTo;

    /** Reason for the manual invoice — required for ONE_TIME, optional for REGULAR */
    private String reason;

    private String notes;

    private List<ManualLineItem> items;

    @Data
    public static class ManualLineItem {
        private String description;
        private Double quantity;
        private Double unitPrice;
    }
}
