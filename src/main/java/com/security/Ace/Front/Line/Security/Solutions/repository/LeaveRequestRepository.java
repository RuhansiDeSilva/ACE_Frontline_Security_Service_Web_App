package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.LeaveRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.LeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployee_IdOrderByCreatedAtDesc(Long employeeId);

    List<LeaveRequest> findByEmployee_IdAndStatusIn(Long employeeId, List<LeaveRequestStatus> statuses);

    List<LeaveRequest> findByClient_CityIgnoreCaseOrderByCreatedAtDesc(String city);

    List<LeaveRequest> findByClient_CityIgnoreCaseAndStatusOrderByCreatedAtDesc(String city, LeaveRequestStatus status);

    List<LeaveRequest> findByEmployee_IdInOrderByCreatedAtDesc(Collection<Long> employeeIds);

    List<LeaveRequest> findByEmployee_IdInAndStatusOrderByCreatedAtDesc(Collection<Long> employeeIds, LeaveRequestStatus status);

    @Query("SELECT lr FROM LeaveRequest lr WHERE EXISTS (" +
            "SELECT 1 FROM SecurityOfficer so WHERE so.areaManager IS NOT NULL " +
            "AND so.emailAddress IS NOT NULL AND lr.employee.email IS NOT NULL " +
            "AND LOWER(TRIM(so.emailAddress)) = LOWER(TRIM(lr.employee.email)) " +
            "AND so.areaManager.id = :amEntityId) " +
            "ORDER BY lr.createdAt DESC")
    List<LeaveRequest> findVisibleToAreaManagerByAreaManagerId(@Param("amEntityId") Long amEntityId);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = :status AND EXISTS (" +
            "SELECT 1 FROM SecurityOfficer so WHERE so.areaManager IS NOT NULL " +
            "AND so.emailAddress IS NOT NULL AND lr.employee.email IS NOT NULL " +
            "AND LOWER(TRIM(so.emailAddress)) = LOWER(TRIM(lr.employee.email)) " +
            "AND so.areaManager.id = :amEntityId) " +
            "ORDER BY lr.createdAt DESC")
    List<LeaveRequest> findVisibleToAreaManagerByAreaManagerIdAndStatus(
            @Param("amEntityId") Long amEntityId, @Param("status") LeaveRequestStatus status);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId " +
            "AND lr.status IN :statuses " +
            "AND ((lr.startDate <= :endDate) AND (lr.endDate >= :startDate))")
    List<LeaveRequest> findOverlappingLeaves(@Param("employeeId") Long employeeId,
                                             @Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate,
                                             @Param("statuses") List<LeaveRequestStatus> statuses);
}
