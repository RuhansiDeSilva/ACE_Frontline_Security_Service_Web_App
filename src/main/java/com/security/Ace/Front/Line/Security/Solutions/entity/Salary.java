package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Represents a monthly payroll record for a single officer.
 * Mapped to the "payroll" table described in your schema.
 */
@Entity
@Table(name = "payroll", indexes = {
        @Index(name = "idx_officer_month", columnList = "officer_id, month"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_month", columnList = "month")
}, uniqueConstraints = {
        @UniqueConstraint(name = "unique_officer_month", columnNames = { "officer_id", "month" })
})
public class Salary {

    public enum Status {
        CALCULATED,
        PAID
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payroll_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "officer_id", nullable = false)
    private User officer;

    // Format: YYYY-MM (e.g. "2026-02")
    @Column(name = "month", length = 7, nullable = false)
    private String month;

    @Column(name = "pay_period_start", nullable = false)
    private LocalDate payPeriodStart;

    @Column(name = "pay_period_end", nullable = false)
    private LocalDate payPeriodEnd;

    @Column(name = "total_shifts", nullable = false)
    private Integer totalShifts = 0;

    @Column(name = "basic_salary", precision = 10, scale = 2, nullable = false)
    private BigDecimal basicSalary;

    @Column(name = "total_allowances", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAllowances;

    @Column(name = "total_deductions", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalDeductions;

    @Column(name = "net_salary", precision = 10, scale = 2, nullable = false)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.CALCULATED;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "calculated_by", length = 50, nullable = false)
    private String calculatedBy;

    @Column(name = "marked_paid_by", length = 50)
    private String markedPaidBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @OneToMany(mappedBy = "payroll", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<SalaryAllowance> salaryAllowances = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "payroll", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<SalaryDeduction> salaryDeductions = new java.util.ArrayList<>();

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getOfficer() {
        return officer;
    }

    public void setOfficer(User officer) {
        this.officer = officer;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public LocalDate getPayPeriodStart() {
        return payPeriodStart;
    }

    public void setPayPeriodStart(LocalDate payPeriodStart) {
        this.payPeriodStart = payPeriodStart;
    }

    public LocalDate getPayPeriodEnd() {
        return payPeriodEnd;
    }

    public void setPayPeriodEnd(LocalDate payPeriodEnd) {
        this.payPeriodEnd = payPeriodEnd;
    }

    public Integer getTotalShifts() {
        return totalShifts;
    }

    public void setTotalShifts(Integer totalShifts) {
        this.totalShifts = totalShifts;
    }

    public BigDecimal getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public BigDecimal getTotalAllowances() {
        return totalAllowances;
    }

    public void setTotalAllowances(BigDecimal totalAllowances) {
        this.totalAllowances = totalAllowances;
    }

    public BigDecimal getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public BigDecimal getNetSalary() {
        return netSalary;
    }

    public void setNetSalary(BigDecimal netSalary) {
        this.netSalary = netSalary;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public String getCalculatedBy() {
        return calculatedBy;
    }

    public void setCalculatedBy(String calculatedBy) {
        this.calculatedBy = calculatedBy;
    }

    public String getMarkedPaidBy() {
        return markedPaidBy;
    }

    public void setMarkedPaidBy(String markedPaidBy) {
        this.markedPaidBy = markedPaidBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public OffsetDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(OffsetDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public java.util.List<SalaryAllowance> getSalaryAllowances() {
        return salaryAllowances;
    }

    public void setSalaryAllowances(java.util.List<SalaryAllowance> salaryAllowances) {
        this.salaryAllowances = salaryAllowances;
    }

    public java.util.List<SalaryDeduction> getSalaryDeductions() {
        return salaryDeductions;
    }

    public void setSalaryDeductions(java.util.List<SalaryDeduction> salaryDeductions) {
        this.salaryDeductions = salaryDeductions;
    }
}
