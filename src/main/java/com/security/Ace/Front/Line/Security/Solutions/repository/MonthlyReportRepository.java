package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.MonthlyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyReportRepository extends JpaRepository<MonthlyReport, Long> {

    List<MonthlyReport> findByAreaManagerId(Long areaManagerId);

    List<MonthlyReport> findByYear(Integer year);

    Optional<MonthlyReport> findByAreaManagerIdAndYearAndMonth(
            Long areaManagerId, Integer year, Integer month);

    @Query("SELECT m FROM MonthlyReport m WHERE m.areaManager.id = :managerId " +
            "ORDER BY m.year DESC, m.month DESC")
    List<MonthlyReport> findByManagerOrderByDate(@Param("managerId") Long managerId);

    @Query("SELECT m FROM MonthlyReport m ORDER BY m.year DESC, m.month DESC, m.generatedDate DESC, m.id DESC")
    List<MonthlyReport> findAllOrderByPeriodAndDateDesc();

    List<MonthlyReport> findByStatus(String status);
}
