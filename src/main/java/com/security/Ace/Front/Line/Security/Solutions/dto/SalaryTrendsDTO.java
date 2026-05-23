package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDate;

public class SalaryTrendsDTO {
    private List<MonthTrend> monthlyTrends;
    private List<SalaryDistribution> distribution;
    private BigDecimal averageSalary;
    private BigDecimal highestSalary;
    private String highestSalaryMonth;
    private BigDecimal lowestSalary;
    private String lowestSalaryMonth;
    private BigDecimal totalYTD;
    private BigDecimal totalOvertime;
    private double growthRate;
    private List<BreakdownItem> allowanceBreakdown;
    private List<BreakdownItem> deductionBreakdown;

    public static class MonthTrend {
        private String month;
        private BigDecimal amount;
        private BigDecimal allowances;
        private BigDecimal deductions;
        private BigDecimal overtime;

        public MonthTrend() {
        }

        public MonthTrend(String month, BigDecimal amount, BigDecimal allowances, BigDecimal deductions,
                          BigDecimal overtime) {
            this.month = month;
            this.amount = amount;
            this.allowances = allowances;
            this.deductions = deductions;
            this.overtime = overtime;
        }

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public BigDecimal getAllowances() {
            return allowances;
        }

        public void setAllowances(BigDecimal allowances) {
            this.allowances = allowances;
        }

        public BigDecimal getDeductions() {
            return deductions;
        }

        public void setDeductions(BigDecimal deductions) {
            this.deductions = deductions;
        }

        public BigDecimal getOvertime() {
            return overtime;
        }

        public void setOvertime(BigDecimal overtime) {
            this.overtime = overtime;
        }
    }

    public static class SalaryDistribution {
        private String range;
        private long count;

        public SalaryDistribution() {
        }

        public SalaryDistribution(String range, long count) {
            this.range = range;
            this.count = count;
        }

        public String getRange() {
            return range;
        }

        public void setRange(String range) {
            this.range = range;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }

    public static class BreakdownItem {
        private String label;
        private BigDecimal amount;

        public BreakdownItem() {
        }

        public BreakdownItem(String label, BigDecimal amount) {
            this.label = label;
            this.amount = amount;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }

    // Getters and Setters
    public List<MonthTrend> getMonthlyTrends() {
        return monthlyTrends;
    }

    public void setMonthlyTrends(List<MonthTrend> monthlyTrends) {
        this.monthlyTrends = monthlyTrends;
    }

    public List<SalaryDistribution> getDistribution() {
        return distribution;
    }

    public void setDistribution(List<SalaryDistribution> distribution) {
        this.distribution = distribution;
    }

    public BigDecimal getAverageSalary() {
        return averageSalary;
    }

    public void setAverageSalary(BigDecimal averageSalary) {
        this.averageSalary = averageSalary;
    }

    public BigDecimal getHighestSalary() {
        return highestSalary;
    }

    public void setHighestSalary(BigDecimal highestSalary) {
        this.highestSalary = highestSalary;
    }

    public String getHighestSalaryMonth() {
        return highestSalaryMonth;
    }

    public void setHighestSalaryMonth(String highestSalaryMonth) {
        this.highestSalaryMonth = highestSalaryMonth;
    }

    public BigDecimal getLowestSalary() {
        return lowestSalary;
    }

    public void setLowestSalary(BigDecimal lowestSalary) {
        this.lowestSalary = lowestSalary;
    }

    public String getLowestSalaryMonth() {
        return lowestSalaryMonth;
    }

    public void setLowestSalaryMonth(String lowestSalaryMonth) {
        this.lowestSalaryMonth = lowestSalaryMonth;
    }

    public BigDecimal getTotalYTD() {
        return totalYTD;
    }

    public void setTotalYTD(BigDecimal totalYTD) {
        this.totalYTD = totalYTD;
    }

    public BigDecimal getTotalOvertime() {
        return totalOvertime;
    }

    public void setTotalOvertime(BigDecimal totalOvertime) {
        this.totalOvertime = totalOvertime;
    }

    public double getGrowthRate() {
        return growthRate;
    }

    public void setGrowthRate(double growthRate) {
        this.growthRate = growthRate;
    }

    public List<BreakdownItem> getAllowanceBreakdown() {
        return allowanceBreakdown;
    }

    public void setAllowanceBreakdown(List<BreakdownItem> allowanceBreakdown) {
        this.allowanceBreakdown = allowanceBreakdown;
    }

    public List<BreakdownItem> getDeductionBreakdown() {
        return deductionBreakdown;
    }

    public void setDeductionBreakdown(List<BreakdownItem> deductionBreakdown) {
        this.deductionBreakdown = deductionBreakdown;
    }
}
