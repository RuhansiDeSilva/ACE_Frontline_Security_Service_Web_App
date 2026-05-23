package com.security.Ace.Front.Line.Security.Solutions.service.strategy;

import com.security.Ace.Front.Line.Security.Solutions.dto.SalaryTrendsDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;

import java.util.List;

/**
 * Strategy interface for salary calculation logic.
 * Allows different salary calculation implementations (Project vs Source) to coexist.
 */
public interface SalaryCalculationStrategy {

    /**
     * Get salary trends for an officer
     */
    SalaryTrendsDTO getSalaryTrends(Long officerId);

    /**
     * Get all salary records
     */
    List<Salary> getAllSalaries();

    /**
     * Get salary records for a specific officer
     */
    List<Salary> getSalariesByOfficer(Long officerId);

    /**
     * Mark salary as paid
     */
    Salary markSalaryAsPaid(Long salaryId);

    /**
     * Get strategy name for logging/debugging
     */
    String getStrategyName();
}
