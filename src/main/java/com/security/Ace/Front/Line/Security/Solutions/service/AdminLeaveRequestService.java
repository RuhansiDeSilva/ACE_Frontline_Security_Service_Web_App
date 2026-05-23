package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.AdminLeaveRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.AdminLeaveSummaryDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.CreateAdminLeaveRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.AdminLeaveRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.AdminLeaveRequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdminLeaveRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminLeaveRequestService {

    private final AdminLeaveRequestRepository adminLeaveRequestRepository;
    private final UserRepository userRepository;

    // 1. Create Request
    @Transactional
    public AdminLeaveRequestDTO createRequest(Long employeeId, CreateAdminLeaveRequestDTO dto) {
        if (dto.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Leave request cannot start on a past date.");
        }
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new RuntimeException("End date cannot be earlier than start date.");
        }

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!List.of("AREA_MANAGER", "OPERATION_MANAGER", "OPERATIONAL_MANAGER", "EXECUTIVE", "EXECUTIVE_OFFICER").contains(employee.getRole())) {
            throw new RuntimeException("Role not authorized for admin leave");
        }

        // Check for overlaps with PENDING or APPROVED
        List<AdminLeaveRequestStatus> activeStatuses = List.of(
                AdminLeaveRequestStatus.PENDING,
                AdminLeaveRequestStatus.APPROVED
        );

        List<AdminLeaveRequest> overlaps = adminLeaveRequestRepository.findOverlappingLeaves(
                employeeId, dto.getStartDate(), dto.getEndDate(), activeStatuses
        );

        if (!overlaps.isEmpty()) {
            throw new RuntimeException("You already have an active leave request during this period");
        }

        // Validate monthly limits
        validateMonthlyLimit(employeeId, dto.getStartDate(), dto.getEndDate());

        // Snapshot requested days (simple calendar duration since admin logic avoids dynamic shift ties)
        // Wait: The rule is actually to count Calendar days? Or working days?
        // Since Admins don't have shift schedules in the same way, we'll count all calendar days between start and end.
        // Wait, did the user specify? "No shift schedule dependency". So we count Calendar days exactly.
        int requestedDays = (int) (dto.getEndDate().toEpochDay() - dto.getStartDate().toEpochDay()) + 1;

        AdminLeaveRequest request = AdminLeaveRequest.builder()
                .employee(employee)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(AdminLeaveRequestStatus.PENDING)
                .consumedLeaveDays(requestedDays)
                .build();

        request = adminLeaveRequestRepository.save(request);
        return mapToDTO(request);
    }

    private void validateMonthlyLimit(Long employeeId, LocalDate newStart, LocalDate newEnd) {
        LocalDate current = newStart;
        while (!current.isAfter(newEnd)) {
            int month = current.getMonthValue();
            int year = current.getYear();

            LocalDate monthStart = LocalDate.of(year, month, 1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

            LocalDate intersectionStart = newStart.isAfter(monthStart) ? newStart : monthStart;
            LocalDate intersectionEnd = newEnd.isBefore(monthEnd) ? newEnd : monthEnd;

            int newLeaveDays = (int) (intersectionEnd.toEpochDay() - intersectionStart.toEpochDay()) + 1;

            // For validation at creation, count all PENDING and APPROVED
            int existingLeaveDays = calculateUsedLeavesForMonth(
                    employeeId, month, year,
                    List.of(AdminLeaveRequestStatus.APPROVED, AdminLeaveRequestStatus.PENDING)
            );

            if (existingLeaveDays + newLeaveDays > 4) {
                throw new RuntimeException("Monthly leave limit exceeded. You cannot request more than 4 leave days for this month.");
            }

            current = monthEnd.plusDays(1);
        }
    }

    private int calculateUsedLeavesForMonth(Long employeeId, int month, int year, List<AdminLeaveRequestStatus> statuses) {
        List<AdminLeaveRequest> requests = adminLeaveRequestRepository.findByEmployee_IdAndStatusIn(employeeId, statuses);

        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        int totalDays = 0;
        for (AdminLeaveRequest req : requests) {
            if (req.getStartDate().isAfter(monthEnd) || req.getEndDate().isBefore(monthStart)) {
                continue;
            }
            if (req.getStatus() == AdminLeaveRequestStatus.APPROVED && req.getConsumedLeaveDays() != null) {
                totalDays += req.getConsumedLeaveDays();
            } else {
                LocalDate intersectionStart = req.getStartDate().isAfter(monthStart) ? req.getStartDate() : monthStart;
                LocalDate intersectionEnd = req.getEndDate().isBefore(monthEnd) ? req.getEndDate() : monthEnd;
                totalDays += (int) (intersectionEnd.toEpochDay() - intersectionStart.toEpochDay()) + 1;
            }
        }
        return totalDays;
    }

    // 2. Get My Leave History
    public List<AdminLeaveRequestDTO> getMyLeaveRequests(Long employeeId) {
        return adminLeaveRequestRepository.findByEmployee_IdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 3. Get My Leave Summary
    public AdminLeaveSummaryDTO getMyLeaveSummary(Long employeeId, Integer month, Integer year) {
        // ONLY APPROVED counts towards the displayed summary/balance correctly as requested
        int used = calculateUsedLeavesForMonth(
                employeeId, month, year,
                List.of(AdminLeaveRequestStatus.APPROVED)
        );

        return AdminLeaveSummaryDTO.builder()
                .monthlyLimit(4)
                .usedLeaves(used)
                .remainingLeaves(Math.max(0, 4 - used))
                .month(month)
                .year(year)
                .build();
    }

    // 4. Get Pendings/All for Director
    public List<AdminLeaveRequestDTO> getForDirector(AdminLeaveRequestStatus status, Integer month, Integer year) {
        List<AdminLeaveRequest> query = status != null 
                ? adminLeaveRequestRepository.findByStatusOrderByCreatedAtDesc(status)
                : adminLeaveRequestRepository.findAll();

        return query.stream()
                .filter(req -> {
                    if (month == null || year == null) return true;
                    // Filter if the request overlaps the exact month/year
                    LocalDate monthStart = LocalDate.of(year, month, 1);
                    LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
                    return !req.getStartDate().isAfter(monthEnd) && !req.getEndDate().isBefore(monthStart);
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 5. Approve
    @Transactional
    public void approveLeave(Long leaveId, Long directorId) {
        AdminLeaveRequest req = adminLeaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (req.getStatus() != AdminLeaveRequestStatus.PENDING) {
            throw new RuntimeException("Only PENDING requests can be approved");
        }
        
        req.setReviewedBy(userRepository.getReferenceById(directorId));
        req.setReviewedAt(LocalDateTime.now());
        req.setStatus(AdminLeaveRequestStatus.APPROVED);
        
        adminLeaveRequestRepository.save(req);
    }

    // 6. Reject
    @Transactional
    public void rejectLeave(Long leaveId, Long directorId, String reason) {
        AdminLeaveRequest req = adminLeaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (req.getStatus() != AdminLeaveRequestStatus.PENDING) {
            throw new RuntimeException("Only PENDING requests can be rejected");
        }
        
        req.setReviewedBy(userRepository.getReferenceById(directorId));
        req.setReviewedAt(LocalDateTime.now());
        req.setStatus(AdminLeaveRequestStatus.REJECTED);
        req.setRejectionReason(reason);
        
        adminLeaveRequestRepository.save(req);
    }

    // 7. Delete Request
    @Transactional
    public void deleteRequest(Long id, Long userId) {
        AdminLeaveRequest req = adminLeaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!req.getEmployee().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this request");
        }

        if (req.getStatus() != AdminLeaveRequestStatus.PENDING) {
            throw new RuntimeException("Only pending leave requests can be deleted.");
        }

        adminLeaveRequestRepository.delete(req);
    }

    private AdminLeaveRequestDTO mapToDTO(AdminLeaveRequest request) {
        return AdminLeaveRequestDTO.builder()
                .id(request.getId())
                .employeeId(request.getEmployee().getId())
                .employeeEmail(request.getEmployee().getEmail())
                .employeeRole(request.getEmployee().getRole())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .rejectionReason(request.getRejectionReason())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .reviewedById(request.getReviewedBy() != null ? request.getReviewedBy().getId() : null)
                .consumedLeaveDays(request.getConsumedLeaveDays())
                .build();
    }
}
