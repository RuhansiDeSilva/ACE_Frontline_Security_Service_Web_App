package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.PayrollStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollStatisticsRepository extends JpaRepository<PayrollStatistics, Long> {

    Optional<PayrollStatistics> findByPayMonthAndRole(String payMonth, String role);

    List<PayrollStatistics> findByPayMonthOrderByRoleAsc(String payMonth);

    List<PayrollStatistics> findByRoleOrderByPayMonthDesc(String role);

    @Query("SELECT ps FROM PayrollStatistics ps ORDER BY ps.payMonth DESC LIMIT 12")
    List<PayrollStatistics> findLast12Months();

    @Query("SELECT ps FROM PayrollStatistics ps WHERE ps.payMonth >= :startMonth AND ps.payMonth <= :endMonth ORDER BY ps.payMonth ASC")
    List<PayrollStatistics> findByMonthRange(@Param("startMonth") String startMonth, @Param("endMonth") String endMonth);
}
