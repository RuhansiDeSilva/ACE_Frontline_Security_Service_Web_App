package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {

    @Query("SELECT COUNT(sa) FROM ShiftAssignment sa WHERE sa.securityOfficer.id = :officerId AND sa.shift.schedule.id = :scheduleId")
    long countBySecurityOfficerIdAndScheduleId(@Param("officerId") Long officerId,
                                               @Param("scheduleId") Long scheduleId);

    @Query("SELECT sa.shift.shiftDate FROM ShiftAssignment sa WHERE sa.securityOfficer.id = :officerId AND sa.shift.schedule.month = :month AND sa.shift.schedule.year = :year ORDER BY sa.shift.shiftDate ASC")
    List<LocalDate> findWorkingDatesByOfficerAndMonthAndYear(@Param("officerId") Long officerId,
                                                             @Param("month") Integer month,
                                                             @Param("year") Integer year);

    List<ShiftAssignment> findByShift_Schedule_Id(Long scheduleId);

    @Query("SELECT sa FROM ShiftAssignment sa WHERE sa.securityOfficer.id = :officerId AND sa.shift.schedule.status = 'APPROVED'")
    List<ShiftAssignment> findApprovedAssignmentsByOfficerId(@Param("officerId") Long officerId);

    @Query("SELECT sa.shift.shiftDate FROM ShiftAssignment sa WHERE sa.securityOfficer.id = :officerId AND sa.shift.shiftDate BETWEEN :startDate AND :endDate ORDER BY sa.shift.shiftDate ASC")
    List<LocalDate> findWorkingDatesByOfficerAndDateRange(@Param("officerId") Long officerId,
                                                          @Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate);

    boolean existsByShift_IdAndSecurityOfficer_Id(Long shiftId, Long officerId);

    List<ShiftAssignment> findBySecurityOfficer_IdAndShift_ShiftDateBetween(Long officerId,
                                                                            LocalDate startDate,
                                                                            LocalDate endDate);

    /**
     * Active model: find APPROVED assignments in a date range whose schedule's client city
     * matches the area of any AREA_MANAGER user linked to the given branch.
     * Replaces the legacy schedule.clientCompany.branch.id path.
     */
    @Query("""
        SELECT sa
        FROM ShiftAssignment sa
        WHERE sa.shift.schedule.status = 'APPROVED'
          AND sa.shift.schedule.client.city IN (
                SELECT u.assignedArea
                FROM User u
                WHERE u.branch.id = :branchId
                  AND u.role = 'AREA_MANAGER'
                  AND u.assignedArea IS NOT NULL
          )
          AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
    """)
    List<ShiftAssignment> findApprovedAssignmentsByBranchAndDateRange(@Param("branchId") Long branchId,
                                                                      @Param("startDate") LocalDate startDate,
                                                                      @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT sa
        FROM ShiftAssignment sa
        WHERE sa.shift.schedule.status = 'APPROVED'
          AND sa.shift.schedule.client.city IS NOT NULL
          AND LOWER(TRIM(sa.shift.schedule.client.city)) = LOWER(TRIM(:assignedArea))
          AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
    """)
    List<ShiftAssignment> findApprovedAssignmentsByAssignedAreaAndDateRange(@Param("assignedArea") String assignedArea,
                                                                             @Param("startDate") LocalDate startDate,
                                                                             @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT sa
        FROM ShiftAssignment sa
        WHERE sa.shift.schedule.status = 'APPROVED'
          AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
    """)
    List<ShiftAssignment> findApprovedAssignmentsByDateRange(@Param("startDate") LocalDate startDate,
                                                              @Param("endDate") LocalDate endDate);

    /**
     * Find approved shift dates for an officer at a specific company in a date range.
     * Uses denormalized clientCompanyName on ShiftAssignment (still valid after migration).
     */
    @Query("""
        SELECT sa.shift.shiftDate
        FROM ShiftAssignment sa
        WHERE sa.securityOfficer.id = :officerId
          AND sa.clientCompanyName = :companyName
          AND sa.shift.schedule.status = 'APPROVED'
          AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
        ORDER BY sa.shift.shiftDate ASC
    """)
    List<LocalDate> findWorkingDatesByOfficerAndCompanyAndDateRange(@Param("officerId") Long officerId,
                                                                    @Param("companyName") String companyName,
                                                                    @Param("startDate") LocalDate startDate,
                                                                    @Param("endDate") LocalDate endDate);

    /**
     * Find distinct company names an officer is scheduled on (APPROVED), in a date range.
     * Uses denormalized clientCompanyName on ShiftAssignment (still valid after migration).
     */
    @Query("""
        SELECT DISTINCT sa.clientCompanyName
        FROM ShiftAssignment sa
        WHERE sa.securityOfficer.id = :officerId
          AND sa.shift.schedule.status = 'APPROVED'
          AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
          AND sa.clientCompanyName IS NOT NULL
    """)
    List<String> findDistinctClientCompanyNamesByOfficerAndDateRangeOnApprovedSchedules(@Param("officerId") Long officerId,
                                                                                        @Param("startDate") LocalDate startDate,
                                                                                        @Param("endDate") LocalDate endDate);

    /**
     * Active model: find distinct officers on APPROVED schedules for a given company in a date range.
     * branchId is retained as a parameter for API compatibility; company name already scopes the result.
     * Replaces the legacy schedule.clientCompany.branch.id path.
     */
    @Query("""
        SELECT DISTINCT sa.securityOfficer
        FROM ShiftAssignment sa
        WHERE sa.shift.schedule.status = 'APPROVED'
          AND sa.clientCompanyName = :companyName
          AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
    """)
    List<SecurityOfficer> findDistinctOfficersByBranchAndCompanyAndDateRange(@Param("branchId") Long branchId,
                                                                             @Param("companyName") String companyName,
                                                                             @Param("startDate") LocalDate startDate,
                                                                             @Param("endDate") LocalDate endDate);

    /**
     * Active model: find distinct officers on APPROVED schedules on a given date,
     * scoped to the area of the AreaManager (via User.assignedArea → Client.city).
     * Replaces the legacy schedule.clientCompany.branch.id subquery.
     */
    @Query("""
        SELECT DISTINCT sa.securityOfficer
        FROM ShiftAssignment sa
        WHERE sa.shift.schedule.status = 'APPROVED'
          AND sa.shift.schedule.client.city IN (
                SELECT u.assignedArea
                FROM User u
                WHERE u.branch.id = (
                      SELECT am.branch.id FROM AreaManager am WHERE am.id = :managerId
                )
                AND u.role = 'AREA_MANAGER'
                AND u.assignedArea IS NOT NULL
          )
          AND sa.shift.shiftDate = :date
    """)
    List<SecurityOfficer> findApprovedOfficersByAreaManagerAndDate(@Param("managerId") Long managerId,
                                                                   @Param("date") LocalDate date);

    @Query("""
        SELECT DISTINCT sa.securityOfficer
        FROM ShiftAssignment sa
        WHERE sa.shift.schedule.status = 'APPROVED'
          AND sa.shift.shiftDate = :date
    """)
    List<SecurityOfficer> findApprovedOfficersByShiftDate(@Param("date") LocalDate date);

    @Query("""
    SELECT sa.shift.shiftDate
    FROM ShiftAssignment sa
    WHERE sa.securityOfficer.id = :officerId
      AND sa.shift.schedule.status = 'APPROVED'
      AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
    ORDER BY sa.shift.shiftDate ASC
""")
    List<LocalDate> findApprovedWorkingDatesByOfficerAndDateRange(
            @Param("officerId") Long officerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
    SELECT sa
    FROM ShiftAssignment sa
    WHERE sa.securityOfficer.id = :officerId
      AND sa.shift.schedule.status = 'APPROVED'
      AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
""")
    List<ShiftAssignment> findBySecurityOfficer_IdAndShiftDateBetweenOnApprovedSchedules(
            @Param("officerId") Long officerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT DISTINCT sa.shift.shiftDate
        FROM ShiftAssignment sa
        WHERE sa.securityOfficer.id = :officerId
          AND sa.shift.schedule.status IN ('APPROVED', 'PENDING', 'DRAFT')
          AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
        ORDER BY sa.shift.shiftDate ASC
    """)
    List<LocalDate> findWorkingDatesByOfficerAndDateRangeOnActiveSchedules(
            @Param("officerId") Long officerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT DISTINCT sa.shift.shiftDate
        FROM ShiftAssignment sa
        WHERE sa.securityOfficer.id = :officerId
          AND sa.shift.shiftDate BETWEEN :startDate AND :endDate
    """)
    List<LocalDate> findDistinctShiftDatesByOfficerAndDateRange(
            @Param("officerId") Long officerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}