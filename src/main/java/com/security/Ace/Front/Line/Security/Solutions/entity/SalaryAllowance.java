package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(
        name = "payroll_allowances",
        indexes = @Index(name = "idx_payroll_allowance", columnList = "payroll_id")
)
public class SalaryAllowance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "allowance_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payroll_id", nullable = false)
    private Salary payroll;

    @Column(name = "allowance_name", length = 100, nullable = false)
    private String allowanceName;

    @Column(name = "allowance_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal allowanceAmount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Salary getPayroll() {
        return payroll;
    }

    public void setPayroll(Salary payroll) {
        this.payroll = payroll;
    }

    public String getAllowanceName() {
        return allowanceName;
    }

    public void setAllowanceName(String allowanceName) {
        this.allowanceName = allowanceName;
    }

    public BigDecimal getAllowanceAmount() {
        return allowanceAmount;
    }

    public void setAllowanceAmount(BigDecimal allowanceAmount) {
        this.allowanceAmount = allowanceAmount;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}

