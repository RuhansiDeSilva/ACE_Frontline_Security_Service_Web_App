package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.AdminLeaveRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.AdminLeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AdminLeaveRequestRepository extends JpaRepository<AdminLeaveRequest, Long> {

    List<AdminLeaveRequest> findByEmployee_IdOrderByCreatedAtDesc(Long employeeId);

    List<AdminLeaveRequest> findByEmployee_IdAndStatusIn(Long employeeId, List<AdminLeaveRequestStatus> statuses);

    List<AdminLeaveRequest> findByStatusOrderByCreatedAtDesc(AdminLeaveRequestStatus status);

    @Query("SELECT l FROM AdminLeaveRequest l WHERE l.employee.id = :employeeId " +
           "AND l.status IN :activeStatuses " +
           "AND l.startDate <= :endDate AND l.endDate >= :startDate")
    List<AdminLeaveRequest> findOverlappingLeaves(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("activeStatuses") List<AdminLeaveRequestStatus> activeStatuses
    );
}
