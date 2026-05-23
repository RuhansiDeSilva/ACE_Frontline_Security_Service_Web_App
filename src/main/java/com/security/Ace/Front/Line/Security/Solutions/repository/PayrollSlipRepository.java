package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.PayrollSlip;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollSlipRepository extends JpaRepository<PayrollSlip, Long> {

    // Find payroll slip by user and month
    Optional<PayrollSlip> findByUserAndPayMonth(User user, String payMonth);

    // Find all slips for a user
    List<PayrollSlip> findByUserOrderByPayMonthDesc(User user);

    // Find all slips for a specific month
    List<PayrollSlip> findByPayMonthOrderByUserIdAsc(String payMonth);

    // Find downloaded slips
    List<PayrollSlip> findByUserAndIsDownloadedTrue(User user);

    // Find slips by status
    List<PayrollSlip> findByUserAndIsViewedTrue(User user);

    // Find slips generated between dates
    @Query("SELECT ps FROM PayrollSlip ps WHERE ps.user = :user AND ps.generatedAt BETWEEN :startDate AND :endDate ORDER BY ps.payMonth DESC")
    List<PayrollSlip> findByUserAndGeneratedDateRange(
            @Param("user") User user,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Find slips by paysheet
    @Query("SELECT ps FROM PayrollSlip ps WHERE ps.paysheet.id = :paysheetId")
    Optional<PayrollSlip> findByPaysheetId(@Param("paysheetId") Long paysheetId);

    // Find all slips for a user in a specific year
    @Query("SELECT ps FROM PayrollSlip ps WHERE ps.user = :user AND ps.payMonth LIKE :yearPrefix ORDER BY ps.payMonth DESC")
    List<PayrollSlip> findByUserAndYear(@Param("user") User user, @Param("yearPrefix") String yearPrefix);

    // Find slips awaiting download
    @Query("SELECT ps FROM PayrollSlip ps WHERE ps.isDownloaded = false ORDER BY ps.generatedAt DESC")
    List<PayrollSlip> findAwaitingDownload();

    // Count slips downloaded by user
    Long countByUserAndIsDownloadedTrue(User user);

    // Find last slip for user
    @Query("SELECT ps FROM PayrollSlip ps WHERE ps.user = :user ORDER BY ps.payMonth DESC LIMIT 1")
    Optional<PayrollSlip> findLatestForUser(@Param("user") User user);
}
