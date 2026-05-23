package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.math.BigDecimal;
import java.util.List;

public class PayrollDetailDTO {
    private Long id;
    private String month;
    private String officerName;
    private String officerId;
    private BigDecimal basicSalary;
    private BigDecimal otRate;
    private int totalShifts;
    private String bankName;
    private String branchName;
    private String accountNumber;
    private List<AllowanceDTO> allowances;
    private List<DeductionDTO> deductions;
    private BigDecimal netSalary;
    private String netSalaryInWords;

    public static class AllowanceDTO {
        private String name;
        private BigDecimal amount;

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

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public String getOfficerName() {
        return officerName;
    }

    public void setOfficerName(String officerName) {
        this.officerName = officerName;
    }

    public String getOfficerId() {
        return officerId;
    }

    public void setOfficerId(String officerId) {
        this.officerId = officerId;
    }

    public BigDecimal getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public BigDecimal getOtRate() {
        return otRate;
    }

    public void setOtRate(BigDecimal otRate) {
        this.otRate = otRate;
    }

    public int getTotalShifts() {
        return totalShifts;
    }

    public void setTotalShifts(int totalShifts) {
        this.totalShifts = totalShifts;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
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

    public BigDecimal getNetSalary() {
        return netSalary;
    }

    public void setNetSalary(BigDecimal netSalary) {
        this.netSalary = netSalary;
    }

    public String getNetSalaryInWords() {
        return netSalaryInWords;
    }

    public void setNetSalaryInWords(String netSalaryInWords) {
        this.netSalaryInWords = netSalaryInWords;
    }
}
