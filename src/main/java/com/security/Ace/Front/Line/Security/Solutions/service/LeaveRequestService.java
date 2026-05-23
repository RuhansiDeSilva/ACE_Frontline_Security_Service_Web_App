package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.LeaveRequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;
    private final AreaManagerRepository areaManagerRepository;
    private final ClientRepository clientRepository;
    private final SecurityOfficerRepository securityOfficerRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ShiftScheduleService shiftScheduleService;
    private final NotificationService notificationService;

    // 1. Create Leave Request
    @Transactional
    public LeaveRequestDTO createLeaveRequest(CreateLeaveRequestDTO dto, Long employeeId) {
        // Validation: Past dates not allowed
        if (dto.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Leave request cannot start on a past date.");
        }

        // Validation: End date must not be before start date
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new RuntimeException("End date cannot be earlier than start date.");
        }

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!List.of("JSO", "SSO", "LSO", "CSO", "SECURITY_OFFICER").contains(employee.getRole())) {
            throw new RuntimeException("Only security officers can request leave");
        }

        Client leaveCompany = resolveLeaveCompany(employee);
        if (leaveCompany == null) {
            throw new RuntimeException("Employee is not assigned to an active client company");
        }

        // Check overlapping leaves
        List<LeaveRequestStatus> activeStatuses = List.of(
                LeaveRequestStatus.PENDING,
                LeaveRequestStatus.PENDING_REASSIGNMENT,
                LeaveRequestStatus.APPROVED
        );

        List<LeaveRequest> overlaps = leaveRequestRepository.findOverlappingLeaves(
                employeeId, dto.getStartDate(), dto.getEndDate(), activeStatuses
        );

        if (!overlaps.isEmpty()) {
            throw new RuntimeException("You already have an active leave request during this period");
        }

        // Validate monthly limits month-by-month
        validateMonthlyLimit(employeeId, dto.getStartDate(), dto.getEndDate(), activeStatuses);

        LeaveRequest request = LeaveRequest.builder()
                .employee(employee)
                .client(leaveCompany)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveRequestStatus.PENDING)
                .replacementHandled(false)
                .build();

        request = leaveRequestRepository.save(request);
        return mapToDTO(request);
    }

    private Client resolveLeaveCompany(User employee) {
        // 1. Direct assignedCompany field (Modern Source)
        String assignedCompany = employee.getAssignedCompany();
        if (assignedCompany != null && !assignedCompany.trim().isEmpty()) {
            Optional<Client> c = clientRepository.findByCompanyNameIgnoreCase(assignedCompany.trim());
            if (c.isPresent()) {
                return c.get();
            } else {
                throw new RuntimeException("Assigned company '" + assignedCompany.trim() + "' does not exist in the system (Active Clients). Please contact admin.");
            }
        }

        // 2. Legacy direct relation (if you choose to migrate User entity later)
        // if (employee.getClient() != null) return employee.getClient();

        // 3. Officer Profile Fallback (SecurityOfficer entity)
        if (employee.getEmail() != null && !employee.getEmail().isBlank()) {
            SecurityOfficer so = securityOfficerRepository.findByEmailAddress(employee.getEmail().trim()).orElse(null);
            if (so != null && so.getAssignedCompany() != null && !so.getAssignedCompany().trim().isEmpty()) {
                String soCompany = so.getAssignedCompany().trim();
                Optional<Client> c = clientRepository.findByCompanyNameIgnoreCase(soCompany);
                if (c.isPresent()) {
                    return c.get();
                } else {
                    throw new RuntimeException("Officer profile company '" + soCompany + "' does not exist in the active clients system.");
                }
            }
        }

        return null;
    }

    private void validateMonthlyLimit(Long employeeId, LocalDate newStart, LocalDate newEnd, List<LeaveRequestStatus> statuses) {
        LocalDate current = newStart;
        while (!current.isAfter(newEnd)) {
            int month = current.getMonthValue();
            int year = current.getYear();

            LocalDate monthStart = LocalDate.of(year, month, 1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

            LocalDate intersectionStart = newStart.isAfter(monthStart) ? newStart : monthStart;
            LocalDate intersectionEnd = newEnd.isBefore(monthEnd) ? newEnd : monthEnd;

            int newLeaveDays = calculateLeaveDaysCount(employeeId, intersectionStart, intersectionEnd);
            int existingLeaveDays = calculateUsedLeavesForMonth(employeeId, month, year, statuses);

            if (existingLeaveDays + newLeaveDays > 4) {
                throw new RuntimeException("Monthly leave limit exceeded. You cannot request more than 4 leave days for this month.");
            }

            current = monthEnd.plusDays(1);
        }
    }

    private int calculateUsedLeavesForMonth(Long employeeId, int month, int year, List<LeaveRequestStatus> statuses) {
        List<LeaveRequest> requests = leaveRequestRepository.findByEmployee_IdAndStatusIn(employeeId, statuses);

        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        int totalDays = 0;
        for (LeaveRequest req : requests) {
            // Check if request overlaps with this month
            if (req.getStartDate().isAfter(monthEnd) || req.getEndDate().isBefore(monthStart)) {
                continue; // No overlap
            }

            // Priority 1: Persistent Snapshot of exact dates (Supports multi-month and reassignments)
            if (req.getApprovedDates() != null && !req.getApprovedDates().isBlank()) {
                String[] dates = req.getApprovedDates().split(",");
                for (String dStr : dates) {
                    LocalDate d = LocalDate.parse(dStr.trim());
                    if (!d.isBefore(monthStart) && !d.isAfter(monthEnd)) {
                        totalDays++;
                    }
                }
            } 
            // Priority 2: Recalculate based on current assignments (For PENDING requests)
            else {
                LocalDate intersectionStart = req.getStartDate().isAfter(monthStart) ? req.getStartDate() : monthStart;
                LocalDate intersectionEnd = req.getEndDate().isBefore(monthEnd) ? req.getEndDate() : monthEnd;
                totalDays += calculateLeaveDaysCount(employeeId, intersectionStart, intersectionEnd);
            }
        }
        return totalDays;
    }

    private int calculateLeaveDaysCount(Long employeeId, LocalDate start, LocalDate end) {
        if (start.isAfter(end)) return 0;
        User user = userRepository.findById(employeeId).orElse(null);
        if (user == null || user.getEmail() == null) {
            return 0;
        }
        SecurityOfficer so = securityOfficerRepository.findByEmailAddress(user.getEmail().trim()).orElse(null);
        if (so == null) {
            return 0;
        }
        // Use active schedules (APPROVED, PENDING, DRAFT) to count intended working dates
        List<LocalDate> workingDates = assignmentRepository.findWorkingDatesByOfficerAndDateRangeOnActiveSchedules(
                so.getId(), start, end);
        return (int) workingDates.stream().distinct().count();
    }

    // 2. Get My Leaves
    public List<LeaveRequestDTO> getMyLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployee_IdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 3. Get My Leave Summary
    public LeaveSummaryDTO getMyLeaveSummary(Long employeeId, Integer month, Integer year) {
        int used = calculateUsedLeavesForMonth(
                employeeId, month, year,
                List.of(LeaveRequestStatus.APPROVED, LeaveRequestStatus.PENDING_REASSIGNMENT)
        );

        return LeaveSummaryDTO.builder()
                .monthlyLimit(4)
                .usedLeaves(used)
                .remainingLeaves(Math.max(0, 4 - used))
                .month(month)
                .year(year)
                .build();
    }

    /**
     * Maps login {@link User} to {@link AreaManager} PK. Emails like {@code am@ace.com} map to the same
     * manager record as {@code pradeep.silva@acefrontline.lk} (see {@code ShiftScheduleController} fallbacks).
     */
    private Optional<Long> resolveAreaManagerEntityId(User am) {
        if (am.getEmail() == null) {
            return Optional.empty();
        }
        String e = am.getEmail().trim();
        return areaManagerRepository.findByEmail(e)
                .map(AreaManager::getId)
                .or(() -> {
                    if ("am@ace.com".equalsIgnoreCase(e)) {
                        return areaManagerRepository.findByEmail("pradeep.silva@acefrontline.lk").map(AreaManager::getId);
                    }
                    if ("areamanager@ace.com".equalsIgnoreCase(e)) {
                        return areaManagerRepository.findByEmail("pradeep.silva@acefrontline.lk").map(AreaManager::getId);
                    }
                    return Optional.empty();
                });
    }

    /**
     * Branch may be on {@link User#branch} or on the legacy {@link AreaManager} row (via {@link #resolveAreaManagerEntityId}).
     */
    private Long resolveBranchIdForAreaManager(User am) {
        if (am.getBranch() != null) {
            return am.getBranch().getId();
        }
        return resolveAreaManagerEntityId(am)
                .flatMap(areaManagerRepository::findById)
                .map(AreaManager::getBranch)
                .map(Branch::getId)
                .orElse(null);
    }

    private boolean isLeaveEmployeeUnderAreaManager(User am, LeaveRequest req) {
        if (req.getEmployee().getEmail() == null) {
            return false;
        }
        Optional<Long> amEntityId = resolveAreaManagerEntityId(am);
        if (amEntityId.isEmpty()) {
            return false;
        }
        String empEmail = req.getEmployee().getEmail().trim();
        return securityOfficerRepository.findByAreaManagerId(amEntityId.get()).stream()
                .map(SecurityOfficer::getEmailAddress)
                .filter(Objects::nonNull)
                .anyMatch(e -> e.trim().equalsIgnoreCase(empEmail));
    }

    // 4. Get Leaves for Branch
    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getLeavesForBranch(Long areaManagerId, LeaveRequestStatus status) {
        User am = userRepository.findById(areaManagerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        checkAreaManagerRole(am);

        String assignedArea = am.getAssignedArea();

        // Business requirement: Filter leave requests strictly to the Area Manager's assigned area.
        return leaveRequestRepository.findAll().stream()
                .filter(lr -> status == null || lr.getStatus() == status)
                .filter(lr -> {
                    if (assignedArea == null || lr.getClient() == null || lr.getClient().getCity() == null) {
                        return false;
                    }
                    return lr.getClient().getCity().equalsIgnoreCase(assignedArea);
                })
                .sorted(Comparator.comparing(LeaveRequest::getCreatedAt).reversed())
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 5. Approve Leave
    @Transactional
    public void approveLeave(Long leaveId, Long areaManagerId) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);

        if (req.getStatus() != LeaveRequestStatus.PENDING) {
            throw new RuntimeException("Only PENDING leaves can be approved");
        }

        req.setReviewedBy(userRepository.getReferenceById(areaManagerId));
        req.setReviewedAt(LocalDateTime.now());

        // Snapshot and persist the amount of actual leave days used before reassignment removes the original officer's shifts
        // We use active schedules so even if the schedule is still PENDING, we capture the intended shifts.
        SecurityOfficer so = resolveSecurityOfficer(req.getEmployee());
        List<LocalDate> workingDates = assignmentRepository.findWorkingDatesByOfficerAndDateRangeOnActiveSchedules(
                so.getId(), req.getStartDate(), req.getEndDate());
        
        req.setConsumedLeaveDays(workingDates.size());
        req.setApprovedDates(workingDates.stream()
                .map(LocalDate::toString)
                .collect(Collectors.joining(",")));

        // Check if there are affected shifts
        List<AffectedShiftDTO> affected = getAffectedShiftsInternal(req);

        if (affected.isEmpty()) {
            req.setStatus(LeaveRequestStatus.APPROVED);
            req.setReplacementHandled(true);
        } else {
            req.setStatus(LeaveRequestStatus.PENDING_REASSIGNMENT);
            req.setReplacementHandled(false);
        }

        leaveRequestRepository.save(req);
    }

    // 6. Reject Leave
    @Transactional
    public void rejectLeave(Long leaveId, Long areaManagerId, String reason) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);

        if (req.getStatus() != LeaveRequestStatus.PENDING && req.getStatus() != LeaveRequestStatus.PENDING_REASSIGNMENT) {
            throw new RuntimeException("Cannot reject this leave");
        }

        req.setReviewedBy(userRepository.getReferenceById(areaManagerId));
        req.setReviewedAt(LocalDateTime.now());
        req.setStatus(LeaveRequestStatus.REJECTED);
        req.setRejectionReason(reason);

        leaveRequestRepository.save(req);
    }

    // 7. Get Affected Shifts
    public List<AffectedShiftDTO> getAffectedShifts(Long leaveId, Long areaManagerId) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);
        return getAffectedShiftsInternal(req);
    }

    private List<AffectedShiftDTO> getAffectedShiftsInternal(LeaveRequest req) {
        SecurityOfficer so = resolveSecurityOfficer(req.getEmployee());
        List<ShiftAssignment> assignments = assignmentRepository
                .findBySecurityOfficer_IdAndShiftDateBetweenOnApprovedSchedules(
                        so.getId(), req.getStartDate(), req.getEndDate());

        return assignments.stream()
                .map(a -> AffectedShiftDTO.builder()
                        .shiftId(a.getShift().getId())
                        .date(a.getShift().getShiftDate())
                        .shiftType(a.getShift().getShiftType())
                        .currentOfficerId(so.getId())
                        .currentOfficerName(req.getEmployee().getFullName() != null
                                ? req.getEmployee().getFullName()
                                : req.getEmployee().getEmail())
                        .assignmentId(a.getId())
                        .build())
                .collect(Collectors.toList());
    }

    private SecurityOfficer resolveSecurityOfficer(User employee) {
        return securityOfficerRepository.findByEmailAddress(employee.getEmail())
                .orElseThrow(() -> new RuntimeException("Security officer profile not found for user"));
    }

    // 8. Get Eligible Replacements
    public List<EligibleReplacementDTO> getEligibleReplacements(Long leaveId, Long assignmentId, Long areaManagerId) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);

        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        SecurityOfficer applicant = resolveSecurityOfficer(req.getEmployee());
        if (!assignment.getSecurityOfficer().getId().equals(applicant.getId())) {
            throw new RuntimeException("This shift is not assigned to the leave applicant");
        }

        Shift shift = assignment.getShift();

        // Allow officers from all officer roles; only exact same shift conflicts are excluded.
        List<User> officers = userRepository.findByRoleIn(
                List.of("SECURITY_OFFICER", "JSO", "SSO", "LSO", "CSO")
        );

        List<EligibleReplacementDTO> eligible = new ArrayList<>();

        for (User officer : officers) {
            if (officer.getId().equals(req.getEmployee().getId())) continue;

            SecurityOfficer so = securityOfficerRepository.findByEmailAddress(officer.getEmail()).orElse(null);
            if (so == null) continue;

            if (assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), so.getId())) {
                continue;
            }

            long currentMonthShifts = assignmentRepository.countBySecurityOfficerIdAndScheduleId(so.getId(), shift.getSchedule().getId());
            if (currentMonthShifts >= 60) {
                continue;
            }

            try {
                shiftScheduleService.validateConsecutiveWorkingDays(so.getId(), shift.getShiftDate(), null);
            } catch (RuntimeException e) {
                continue;
            }

            List<LeaveRequest> officerLeaves = leaveRequestRepository.findOverlappingLeaves(
                    officer.getId(), shift.getShiftDate(), shift.getShiftDate(),
                    List.of(LeaveRequestStatus.APPROVED, LeaveRequestStatus.PENDING_REASSIGNMENT)
            );
            if (!officerLeaves.isEmpty()) {
                continue;
            }

            eligible.add(EligibleReplacementDTO.builder()
                    .officerId(officer.getId())
                    .officerName(officer.getFullName() != null ? officer.getFullName() : officer.getEmail())
                    .build());
        }

        return eligible;
    }



    // 9. Reassign Shift
    @Transactional
    public void reassignShift(Long leaveId, Long assignmentId, ReassignShiftRequestDTO dto, Long areaManagerId) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);

        if (req.getStatus() != LeaveRequestStatus.PENDING_REASSIGNMENT) {
            throw new RuntimeException("Leave is not pending reassignment");
        }

        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        SecurityOfficer applicant = resolveSecurityOfficer(req.getEmployee());
        if (!assignment.getSecurityOfficer().getId().equals(applicant.getId())) {
            throw new RuntimeException("This shift is not assigned to the leave applicant");
        }

        User replacement = userRepository.findById(dto.getReplacementOfficerId())
                .orElseThrow(() -> new RuntimeException("Replacement officer not found"));

        SecurityOfficer replacementSo = securityOfficerRepository.findByEmailAddress(replacement.getEmail())
                .orElseThrow(() -> new RuntimeException("Replacement officer not found in security officers"));

        Shift shift = assignment.getShift();
        if (assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), replacementSo.getId())) {
            throw new RuntimeException("Replacement officer is already assigned to this shift");
        }
        long currentMonthShifts = assignmentRepository.countBySecurityOfficerIdAndScheduleId(replacementSo.getId(), shift.getSchedule().getId());
        if (currentMonthShifts >= 60) {
            throw new RuntimeException("Replacement officer reached 60 shifts limit");
        }
        try {
            shiftScheduleService.validateConsecutiveWorkingDays(replacementSo.getId(), shift.getShiftDate(), null);
        } catch (RuntimeException e) {
            throw new RuntimeException("Replacement officer would violate 6 consecutive days rule");
        }

        assignment.setSecurityOfficer(replacementSo);
        assignmentRepository.save(assignment);

        String msg = String.format(
                "You have been reassigned to cover a shift on %s (%s) at %s while another officer is on leave.",
                shift.getShiftDate(), shift.getShiftType(), req.getClient().getCompanyName());
        notificationService.createNotification(replacement.getId(), msg);

        // Check if there are any remaining affected shifts
        List<AffectedShiftDTO> remaining = getAffectedShiftsInternal(req);
        if (remaining.isEmpty()) {
            req.setStatus(LeaveRequestStatus.APPROVED);
            req.setReplacementHandled(true);
            leaveRequestRepository.save(req);
        }
    }

    private LeaveRequest validateLeaveAccess(Long leaveId, Long areaManagerId) {
        LeaveRequest req = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        User am = userRepository.findById(areaManagerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        checkAreaManagerRole(am);

        // Enforce area boundaries for leave approval actions (Mapping Client.city -> AreaManager.assignedArea)
        String assignedArea = am.getAssignedArea();
        String leaveArea = (req.getClient() != null) ? req.getClient().getCity() : null;

        if (assignedArea == null || !assignedArea.equalsIgnoreCase(leaveArea)) {
            throw new RuntimeException("Access Denied: This leave request (" + (leaveArea != null ? leaveArea : "Unknown")
                + ") is not in your assigned area (" + (assignedArea != null ? assignedArea : "None") + ")");
        }

        return req;
    }

    @Transactional
    public void deleteLeaveRequest(Long id, Long employeeId) {
        LeaveRequest req = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        if (!req.getEmployee().getId().equals(employeeId)) {
            throw new RuntimeException("Access denied: You can only delete your own leave requests");
        }

        if (req.getStatus() != LeaveRequestStatus.PENDING) {
            throw new RuntimeException("Only pending leave requests can be deleted.");
        }

        leaveRequestRepository.delete(req);
    }

    private void checkAreaManagerRole(User user) {
        String role = user.getRole() != null ? user.getRole().trim() : "NULL";
        if (!role.equalsIgnoreCase("AREA_MANAGER") && !role.equalsIgnoreCase("ROLE_AREA_MANAGER")) {
            throw new RuntimeException("User (ID: " + user.getId() + ", Email: " + user.getEmail() 
                + ") is not an active Area Manager. Role found: [" + role + "]");
        }
    }

    private LeaveRequestDTO mapToDTO(LeaveRequest req) {
        return LeaveRequestDTO.builder()
                .id(req.getId())
                .employeeId(req.getEmployee().getId())
                .employeeName(req.getEmployee().getEmail())
                .clientId(req.getClient().getClientId())
                .clientName(req.getClient().getCompanyName())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .reason(req.getReason())
                .status(req.getStatus())
                .rejectionReason(req.getRejectionReason())
                .createdAt(req.getCreatedAt())
                .reviewedAt(req.getReviewedAt())
                .reviewedById(req.getReviewedBy() != null ? req.getReviewedBy().getId() : null)
                .reviewedByName(req.getReviewedBy() != null ? req.getReviewedBy().getEmail() : null)
                .replacementHandled(req.isReplacementHandled())
                .build();
    }
}
