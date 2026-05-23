package com.security.Ace.Front.Line.Security.Solutions.service.strategy.impl;

import com.security.Ace.Front.Line.Security.Solutions.dto.SalaryTrendsDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import com.security.Ace.Front.Line.Security.Solutions.repository.SalaryRepository;
import com.security.Ace.Front.Line.Security.Solutions.service.SalaryService;
import com.security.Ace.Front.Line.Security.Solutions.service.strategy.SalaryCalculationStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Project Version Implementation of Salary Calculation Strategy
 * Uses the existing SalaryService logic from the project.
 */
@Component("projectSalaryStrategy")
@RequiredArgsConstructor
@Slf4j
public class ProjectSalaryServiceImpl implements SalaryCalculationStrategy {

    private final SalaryService salaryService;
    private final SalaryRepository salaryRepository;

    @Override
    public SalaryTrendsDTO getSalaryTrends(Long officerId) {
        log.info("ProjectSalaryServiceImpl: Getting salary trends for officer ID: {}", officerId);
        return salaryService.getSalaryTrends(officerId);
    }

    @Override
    public List<Salary> getAllSalaries() {
        log.info("ProjectSalaryServiceImpl: Getting all salaries");
        return salaryRepository.findAll();
    }

    @Override
    public List<Salary> getSalariesByOfficer(Long officerId) {
        log.info("ProjectSalaryServiceImpl: Getting salaries for officer ID: {}", officerId);
        return salaryRepository.findByOfficer_Id(officerId);
    }

    @Override
    public Salary markSalaryAsPaid(Long salaryId) {
        log.info("ProjectSalaryServiceImpl: Marking salary ID {} as paid", salaryId);
        return salaryService.markSalaryAsPaid(salaryId);
    }

    @Override
    public String getStrategyName() {
        return "PROJECT_SALARY_STRATEGY";
    }
}
