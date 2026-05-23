package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryAllowance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryAllowanceRepository extends JpaRepository<SalaryAllowance, Long> {

    List<SalaryAllowance> findByPayroll(Salary payroll);

    List<SalaryAllowance> findByPayroll_Id(Long id);
}
