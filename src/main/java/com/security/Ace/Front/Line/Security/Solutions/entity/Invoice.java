package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceType;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id")
    private Integer invoiceId;

    // e.g., INV-2026-001
    @Column(name = "invoice_number", unique = true, nullable = false, length = 50)
    private String invoiceNumber;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    // Billing period — month and year the invoice covers
    @Column(name = "billing_month", nullable = false)
    private Integer billingMonth;

    @Column(name = "billing_year", nullable = false)
    private Integer billingYear;

    // Explicit service period dates printed on invoice
    @Column(name = "period_from", nullable = false)
    private LocalDate periodFrom;

    @Column(name = "period_to", nullable = false)
    private LocalDate periodTo;

    // Date invoice was generated (1st of the month)
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    // Payment due date
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    // OIC total + JSO total
    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    // Total deductions for the period
    @Column(name = "deductions_total", precision = 12, scale = 2)
    private BigDecimal deductionsTotal = BigDecimal.ZERO;

    // Subtotal − Deductions
    @Column(name = "net_subtotal", precision = 12, scale = 2)
    private BigDecimal netSubtotal = BigDecimal.ZERO;

    // Admin/misc charges
    @Column(name = "other_charges", precision = 12, scale = 2)
    private BigDecimal otherCharges = BigDecimal.ZERO;

    // Net Subtotal + Other Charges (pre-tax total)
    @Column(name = "invoice_amount", precision = 12, scale = 2)
    private BigDecimal invoiceAmount = BigDecimal.ZERO;

    // 2.5% SSCL on invoiceAmount
    @Column(name = "sscl_amount", precision = 12, scale = 2)
    private BigDecimal ssclAmount = BigDecimal.ZERO;

    // 18% VAT on invoiceAmount
    @Column(name = "vat_amount", precision = 12, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    // invoiceAmount + ssclAmount + vatAmount
    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "balance_amount", precision = 12, scale = 2)
    private BigDecimal balanceAmount = BigDecimal.ZERO;

    // 1.5% per month, applied after grace period
    @Column(name = "late_fee", precision = 12, scale = 2)
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(name = "late_fee_applied")
    private Boolean lateFeeApplied = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", length = 20)
    private InvoiceType invoiceType = InvoiceType.AUTO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // For MANUAL invoices — reason required for audit trail
    @Column(name = "manual_reason", columnDefinition = "TEXT")
    private String manualReason;

    @Column(name = "dispute_reason", columnDefinition = "TEXT")
    private String disputeReason;

    @Column(name = "waived_amount", precision = 12, scale = 2)
    private BigDecimal waivedAmount;

    @Column(name = "waived_reason", columnDefinition = "TEXT")
    private String waivedReason;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    // Path to generated PDF after invoice is issued
    @Column(name = "pdf_path", length = 500)
    private String pdfPath;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private Integer approvedBy;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    // ── Relationships — excluded from toString/equals to prevent
    //    LazyInitializationException ────────────────────────────────────────

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InvoiceItem> items;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Payment> payments;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Deduction> deductions;
}