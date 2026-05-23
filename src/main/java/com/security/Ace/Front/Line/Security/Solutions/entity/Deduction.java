package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.DeductionApprovalStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.DeductionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deductions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Deduction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deduction_id")
    private Integer deductionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(name = "deduction_type", nullable = false, length = 50)
    private DeductionType deductionType;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "incident_date", nullable = false)
    private LocalDate incidentDate;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "officer_id")
    private Integer officerId;

    @Column(name = "officer_name", length = 100)
    private String officerName;

    // Which billing period this deduction targets
    @Column(name = "target_billing_month")
    private Integer targetBillingMonth;

    @Column(name = "target_billing_year")
    private Integer targetBillingYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Column(name = "applied_to_invoice")
    private Boolean appliedToInvoice = false;

    /**
     * If the invoice for this month is already ISSUED, the deduction is queued
     * for the next month's invoice automatically.
     */
    @Column(name = "queued_for_next_month")
    private Boolean queuedForNextMonth = false;

    /**
     * Accountant must approve or reject each deduction before it is applied.
     * Defaults to PENDING.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "accountant_approval_status", length = 20)
    private DeductionApprovalStatus accountantApprovalStatus = DeductionApprovalStatus.PENDING;

    @Column(name = "accountant_rejection_reason", columnDefinition = "TEXT")
    private String accountantRejectionReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}