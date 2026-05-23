package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PayrollResponseDTO {
    private Long id;
    private OfficerInfo officer;
    private String month;
    private BigDecimal basicSalary;
    private BigDecimal totalAllowances;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;
    private LocalDate paymentDate;
    private String status;

    public static class OfficerInfo {
        private String officerId;
        private String fullName;

        public String getOfficerId() {
            return officerId;
        }

        public void setOfficerId(String officerId) {
            this.officerId = officerId;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OfficerInfo getOfficer() {
        return officer;
    }

    public void setOfficer(OfficerInfo officer) {
        this.officer = officer;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
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

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
