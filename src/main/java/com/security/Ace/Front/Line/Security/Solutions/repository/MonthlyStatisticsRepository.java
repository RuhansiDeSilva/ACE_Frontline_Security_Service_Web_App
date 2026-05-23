package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.MonthlyStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyStatisticsRepository extends JpaRepository<MonthlyStatistics, Long> {

    void deleteByAreaManagerIdAndMonthAndYear(Long areaManagerId, Integer month, Integer year);

    Optional<MonthlyStatistics> findBySecurityOfficerIdAndYearAndMonth(Long securityOfficerId, Integer year, Integer month);

    List<MonthlyStatistics> findByMonthAndYearOrderBySecurityOfficer_FullNameAsc(Integer month, Integer year);
}

