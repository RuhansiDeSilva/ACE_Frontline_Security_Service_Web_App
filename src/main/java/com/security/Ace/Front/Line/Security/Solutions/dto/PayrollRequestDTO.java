package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class PayrollRequestDTO {
    private Long officerId;
    private String month;
    private LocalDate payPeriodStart;
    private LocalDate payPeriodEnd;
    private int totalShifts;
    private BigDecimal basicSalary;
    private BigDecimal overtimeAmount;
    private List<AllowanceDTO> allowances;
    private List<DeductionDTO> deductions;

    public static class AllowanceDTO {
        private String name;
        private BigDecimal amount;

        // Getters and setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }

    public static class DeductionDTO {
        private String name;
        private BigDecimal amount;

        // Getters and setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }

    // Getters and Setters for top level
    public Long getOfficerId() {
        return officerId;
    }

    public void setOfficerId(Long officerId) {
        this.officerId = officerId;
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

    public int getTotalShifts() {
        return totalShifts;
    }

    public void setTotalShifts(int totalShifts) {
        this.totalShifts = totalShifts;
    }

    public BigDecimal getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public BigDecimal getOvertimeAmount() {
        return overtimeAmount;
    }

    public void setOvertimeAmount(BigDecimal overtimeAmount) {
        this.overtimeAmount = overtimeAmount;
    }

    public List<AllowanceDTO> getAllowances() {
        return allowances;
    }

    public void setAllowances(List<AllowanceDTO> allowances) {
        this.allowances = allowances;
    }

    public List<DeductionDTO> getDeductions() {
        return deductions;
    }

    public void setDeductions(List<DeductionDTO> deductions) {
        this.deductions = deductions;
    }
}
