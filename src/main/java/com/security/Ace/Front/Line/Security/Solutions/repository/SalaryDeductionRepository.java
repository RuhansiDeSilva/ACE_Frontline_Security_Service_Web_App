package com.security.Ace.Front.Line.Security.Solutions.repository;


import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryDeduction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryDeductionRepository extends JpaRepository<SalaryDeduction, Long> {

    List<SalaryDeduction> findByPayroll(Salary payroll);

    List<SalaryDeduction> findByPayroll_Id(Long id);
}

