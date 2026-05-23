package com.security.Ace.Front.Line.Security.Solutions.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Attendance;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findBySecurityOfficerId(Long securityOfficerId);

    List<Attendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);

    List<Attendance> findBySecurityOfficerIdAndAttendanceDateBetween(
            Long securityOfficerId, LocalDate startDate, LocalDate endDate);

    Optional<Attendance> findBySecurityOfficerAndAttendanceDate(
            SecurityOfficer securityOfficer, LocalDate attendanceDate);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.securityOfficer.id = :officerId " +
            "AND a.attendanceDate BETWEEN :startDate AND :endDate AND a.isShiftCounted = true")
    Integer countShiftsByOfficerInPeriod(
            @Param("officerId") Long officerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(a.overtimeHours) FROM Attendance a WHERE a.securityOfficer.id = :officerId " +
            "AND a.attendanceDate BETWEEN :startDate AND :endDate")
    Double sumOvertimeHoursByOfficerInPeriod(
            @Param("officerId") Long officerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /** Sum working hours for scheduled days only (dates must match approved shift assignment days). */
    @Query("SELECT COALESCE(SUM(a.hoursWorked), 0.0) FROM Attendance a WHERE a.securityOfficer.id = :officerId " +
            "AND a.attendanceDate IN :dates")
    Double sumHoursWorkedByOfficerOnDates(
            @Param("officerId") Long officerId,
            @Param("dates") List<LocalDate> dates);

    @Query("SELECT COALESCE(SUM(a.overtimeHours), 0.0) FROM Attendance a WHERE a.securityOfficer.id = :officerId " +
            "AND a.attendanceDate IN :dates")
    Double sumOvertimeHoursByOfficerOnDates(
            @Param("officerId") Long officerId,
            @Param("dates") List<LocalDate> dates);

    /** Counts attendance rows for the officer across the given dates (regardless of shift-counted flag). */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.securityOfficer.id = :officerId AND a.attendanceDate IN :dates")
    Long countAttendanceRowsByOfficerOnDates(
            @Param("officerId") Long officerId,
            @Param("dates") List<LocalDate> dates);

    @Query("SELECT a FROM Attendance a WHERE a.securityOfficer.areaManager.id = :managerId " +
            "AND a.attendanceDate BETWEEN :startDate AND :endDate")
    List<Attendance> findByAreaManagerInPeriod(
            @Param("managerId") Long managerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Monthly OT hours for a specific client and rank, based on attendance rows
     * mapped through assigned_officers (officer_id -> security_officer_id).
     */
    @Query(value = "SELECT COALESCE(SUM(a.overtime_hours), 0) " +
            "FROM attendance a " +
            "JOIN assigned_officers ao ON ao.officer_id = a.security_officer_id " +
            "WHERE ao.client_id = :clientId " +
            "AND ao.officer_rank = :rank " +
            "AND ao.is_active = 1 " +
            "AND a.attendance_date BETWEEN :startDate AND :endDate " +
            "AND a.attendance_date >= ao.assigned_from " +
            "AND (ao.assigned_to IS NULL OR a.attendance_date <= ao.assigned_to)",
            nativeQuery = true)
    Double sumOvertimeHoursByClientAndRankInPeriod(
            @Param("clientId") Integer clientId,
            @Param("rank") String rank,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
