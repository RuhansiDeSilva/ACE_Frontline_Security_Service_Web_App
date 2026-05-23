package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Tracks individual monthly deductions for an approved loan.
 * When a loan is approved, a deduction schedule is created with one entry per month.
 * The accountant marks each month's deduction as PAID when processing payroll.
 */
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "loan_deductions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanDeduction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_request_id", nullable = false)
    private LoanRequest loanRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The month this deduction applies to (e.g. "2026-03") */
    @Column(nullable = false)
    private String deductionMonth;

    /** The installment amount for this month */
    @Column(nullable = false)
    private Double amount;

    /** PENDING = not yet deducted, PAID = deducted from salary */
    @Column(nullable = false)
    private String status; // "PENDING" or "PAID"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    private LocalDateTime processedAt;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}
