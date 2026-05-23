package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, Long> {

    List<WeeklyReport> findByAreaManagerId(Long areaManagerId);

    /** Newest generated rows first (for UI + API consumption). */
    List<WeeklyReport> findByAreaManagerIdOrderByGeneratedDateDescWeekStartDateDescIdDesc(Long areaManagerId);

    List<WeeklyReport> findBySecurityOfficerId(Long securityOfficerId);

    List<WeeklyReport> findByYearAndWeekNumber(Integer year, Integer weekNumber);

    Optional<WeeklyReport> findBySecurityOfficerIdAndYearAndWeekNumber(
            Long securityOfficerId, Integer year, Integer weekNumber);

    Optional<WeeklyReport> findBySecurityOfficerIdAndYearAndMonthAndWeekNumber(
            Long securityOfficerId, Integer year, Integer month, Integer weekNumber);

    List<WeeklyReport> findByAreaManagerIdAndSecurityOfficerIdAndYearAndMonthAndWeekNumber(
            Long areaManagerId,
            Long securityOfficerId,
            Integer year,
            Integer month,
            Integer weekNumber);

    Optional<WeeklyReport> findBySecurityOfficerIdAndYearAndMonthAndWeekNumberAndClientCompanyName(
            Long securityOfficerId,
            Integer year,
            Integer month,
            Integer weekNumber,
            String clientCompanyName);

    @Query("SELECT w FROM WeeklyReport w WHERE w.areaManager.id = :managerId " +
            "AND w.year = :year ORDER BY w.generatedDate DESC, w.weekStartDate DESC, w.id DESC")
    List<WeeklyReport> findByManagerAndYear(
            @Param("managerId") Long managerId,
            @Param("year") Integer year);

    /** All rows, newest first — for operational manager oversight. */
    List<WeeklyReport> findAllByOrderByGeneratedDateDescWeekStartDateDescIdDesc();
}
