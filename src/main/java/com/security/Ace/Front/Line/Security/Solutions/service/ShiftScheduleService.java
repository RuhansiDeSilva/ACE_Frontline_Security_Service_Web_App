package com.security.Ace.Front.Line.Security.Solutions.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.security.Ace.Front.Line.Security.Solutions.dto.AssignOfficerRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.CreateScheduleRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ShiftAssignmentDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ShiftDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ShiftScheduleDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.Shift;
import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftAssignment;
import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftSchedule;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ScheduleStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SecurityOfficerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ShiftAssignmentRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ShiftRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ShiftScheduleRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShiftScheduleService {

    private final ShiftScheduleRepository scheduleRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final SecurityOfficerRepository securityOfficerRepository;

    // ── Helper: resolve Client by name from active table ──────────────────────
    private Client resolveClientByName(String companyName) {
        if (companyName == null || companyName.isBlank()) {
            throw new RuntimeException("Data Error: No assigned company provided.");
        }
        return clientRepository.findByCompanyName(companyName)
                .orElseThrow(() -> new RuntimeException(
                        "Data Error: Company '" + companyName + "' not found in active clients table. "
                        + "Please verify the user's assigned_company matches a clients.company_name value."));
    }

    // ── Helper: resolve Client by ID ──────────────────────────────────────────
    private Client resolveClientById(Integer clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException(
                        "Data Error: Client with ID " + clientId + " not found."));
    }

    // ── Helper: resolve SecurityOfficer from users.id via strict bridge ────────
    // The frontend always sends users.id. We ensure a real SecurityOfficer
    // record exists by finding or creating it from User data.
    private SecurityOfficer resolveSecurityOfficerByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(
                        "Officer not found: no user with ID " + userId));

        // Strict find-or-create by email to avoid duplicates
        return securityOfficerRepository.findByEmailAddress(user.getEmail())
                .orElseGet(() -> {
                    System.out.println("[Bridge] Provisioning SecurityOfficer for user: " + user.getEmail());
                    SecurityOfficer newOfficer = new SecurityOfficer();
                    newOfficer.setEmailAddress(user.getEmail());
                    newOfficer.setFullName(user.getFullName() != null ? user.getFullName() : user.getUsername());
                    newOfficer.setSecurityId(user.getUsername() != null ? user.getUsername() : "SO-" + user.getId());
                    newOfficer.setAssignedCompany(user.getAssignedCompany() != null ? user.getAssignedCompany() : "N/A");
                    newOfficer.setBranch(user.getBranch() != null ? user.getBranch().getBranchName() : "N/A");
                    newOfficer.setContactNumber(user.getMobileNumber() != null ? user.getMobileNumber() : "N/A");
                    newOfficer.setJoinedDate(user.getJoinDate() != null ? user.getJoinDate() : LocalDate.now());
                    newOfficer.setStatus("ACTIVE");
                    return securityOfficerRepository.save(newOfficer);
                });
    }

    // 1. createSchedule (called from controller POST /)
    @Transactional
    public ShiftScheduleDTO createSchedule(CreateScheduleRequest request, Long createdByUserId) {
        Client client = resolveClientById(request.getClientId());
        User creator = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<ShiftSchedule> existing = scheduleRepository
                .findByClient_ClientIdAndMonthAndYear(client.getClientId(), request.getMonth(), request.getYear());
        if (existing.isPresent()) {
            throw new RuntimeException("Schedule already exists for this client, month, and year.");
        }

        ShiftSchedule schedule = ShiftSchedule.builder()
                .client(client)
                .month(request.getMonth())
                .year(request.getYear())
                .status(ScheduleStatus.DRAFT)
                .createdBy(creator)
                .build();

        schedule = scheduleRepository.save(schedule);
        return mapToDTO(schedule);
    }

    // 2. getScheduleById
    @Transactional
    public ShiftScheduleDTO getScheduleById(Long scheduleId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        return mapToDTO(schedule);
    }

    // 3. assignOfficersToShift (JSO or AM assigns officers)
    @Transactional
    public void assignOfficersToShift(Long scheduleId, AssignOfficerRequest request, Long userId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAreaManager = "AREA_MANAGER".equals(user.getRole());

        if (isAreaManager) {
            // Area Manager specific locks and validations
            assertAreaManagerHasAccess(user, schedule);
            if (schedule.getStatus() != ScheduleStatus.SUBMITTED) {
                throw new RuntimeException("Area manager can edit only SUBMITTED schedules during review.");
            }
        } else {
            // JSO specific locks
            if (schedule.getStatus() != ScheduleStatus.DRAFT) {
                throw new RuntimeException("Cannot edit assignments. Schedule is not in DRAFT status.");
            }
        }

        Shift shift = shiftRepository
                .findBySchedule_IdAndShiftDateAndShiftType(scheduleId, request.getDate(), request.getShiftType())
                .orElseGet(() -> shiftRepository.save(Shift.builder()
                        .schedule(schedule)
                        .shiftDate(request.getDate())
                        .shiftType(request.getShiftType())
                        .build()));

        Set<Long> uniqueOfficerIds = new HashSet<>(request.getSecurityOfficerIds());

        for (Long officerId : uniqueOfficerIds) {
            // officerId is users.id; bridge to security_officers via email
            SecurityOfficer officer = resolveSecurityOfficerByUserId(officerId);

            if (assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), officer.getId())) {
                throw new RuntimeException("Officer " + officerId + " is already assigned to this shift.");
            }

            long currentMonthShifts = assignmentRepository.countBySecurityOfficerIdAndScheduleId(officer.getId(), scheduleId);
            if (currentMonthShifts >= 60) {
                throw new RuntimeException(
                        "Officer " + officerId + " has exceeded the maximum of 60 shifts for the month.");
            }

            validateConsecutiveWorkingDays(officer.getId(), request.getDate(), null);

            ShiftAssignment assignment = ShiftAssignment.builder()
                    .shift(shift)
                    .securityOfficer(officer)
                    .clientCompanyName(officer.getAssignedCompany())
                    .build();
            assignmentRepository.save(assignment);
        }

        // Update metadata if AM edited
        if (isAreaManager) {
            schedule.setEditedByAreaManager(true);
            schedule.setAreaManagerEditedAt(LocalDateTime.now());
            scheduleRepository.save(schedule);
        }
    }

    // 4. removeAssignment
    @Transactional
    public void removeAssignment(Long assignmentId, Long userId) {
        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ShiftSchedule schedule = assignment.getShift().getSchedule();
        boolean isAreaManager = "AREA_MANAGER".equals(user.getRole());

        if (isAreaManager) {
            assertAreaManagerHasAccess(user, schedule);
            if (schedule.getStatus() != ScheduleStatus.SUBMITTED) {
                throw new RuntimeException("Area manager can edit only SUBMITTED schedules during review.");
            }
        } else {
            if (schedule.getStatus() != ScheduleStatus.DRAFT) {
                throw new RuntimeException("Cannot remove assignment. Schedule is not in DRAFT status.");
            }
        }

        assignmentRepository.delete(assignment);
        assignmentRepository.flush();

        if (isAreaManager) {
            schedule.setEditedByAreaManager(true);
            schedule.setAreaManagerEditedAt(LocalDateTime.now());
            scheduleRepository.save(schedule);
        }
    }

    // 5. submitSchedule
    @Transactional
    public void submitSchedule(Long scheduleId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        if (schedule.getStatus() != ScheduleStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT schedules can be submitted");
        }
        schedule.setStatus(ScheduleStatus.SUBMITTED);
        schedule.setSubmittedDate(LocalDateTime.now());
        scheduleRepository.save(schedule);
    }

    // 6. approveSchedule
    @Transactional
    public void approveSchedule(Long scheduleId, Long areaManagerUserId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        User areaManager = userRepository.findById(areaManagerUserId)
                .orElseThrow(() -> new RuntimeException("Area manager not found"));

        if (schedule.getStatus() != ScheduleStatus.SUBMITTED) {
            throw new RuntimeException("Only SUBMITTED schedules can be approved");
        }
        if (!"AREA_MANAGER".equals(areaManager.getRole())) {
            throw new RuntimeException("Only AREA_MANAGER can approve schedules");
        }

        String assignedArea = areaManager.getAssignedArea();
        if (assignedArea == null || assignedArea.trim().isEmpty()) {
            throw new RuntimeException("Area manager does not have an assigned area configured.");
        }

        String clientCity = schedule.getClient().getCity();
        if (clientCity == null || !assignedArea.equalsIgnoreCase(clientCity)) {
            throw new RuntimeException(
                    "Access Denied: Client city '" + clientCity + "' does not match your assigned area '" + assignedArea + "'.");
        }

        schedule.setStatus(ScheduleStatus.APPROVED);
        schedule.setApprovedDate(LocalDateTime.now());
        scheduleRepository.save(schedule);
    }

    // 7. autoGenerateSchedule
    @Transactional
    public void autoGenerateSchedule(Long scheduleId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (schedule.getStatus() != ScheduleStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT schedules can be auto-generated");
        }

        List<ShiftAssignment> existingAssignments = assignmentRepository.findByShift_Schedule_Id(scheduleId);
        assignmentRepository.deleteAll(existingAssignments);
        assignmentRepository.flush();

        String companyName = schedule.getClient().getCompanyName();
        List<User> availableOfficers = getAvailableOfficersForClient(companyName);
        if (availableOfficers.isEmpty()) {
            throw new RuntimeException(
                    "No available security officers found for company '" + companyName + "'. "
                    + "Ensure officers have the correct assigned_company value.");
        }

        LocalDate startDate = LocalDate.of(schedule.getYear(), schedule.getMonth(), 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        int officerIndex = 0;
        int maxShiftsPerDay = 2;

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            final LocalDate currentDate = date;

            for (ShiftType type : ShiftType.values()) {
                Shift shift = shiftRepository.findBySchedule_IdAndShiftDateAndShiftType(scheduleId, currentDate, type)
                        .orElseGet(() -> shiftRepository.save(Shift.builder()
                                .schedule(schedule)
                                .shiftDate(currentDate)
                                .shiftType(type)
                                .build()));

                int assignmentsAdded = 0;
                int attempts = 0;

                while (assignmentsAdded < maxShiftsPerDay && attempts < availableOfficers.size()) {
                    User user = availableOfficers.get(officerIndex);
                    officerIndex = (officerIndex + 1) % availableOfficers.size();
                    attempts++;

                    try {
                        // Safe bridge: Find or Create SecurityOfficer from User data
                        SecurityOfficer officer = resolveSecurityOfficerByUserId(user.getId());

                        long currentMonthShifts = assignmentRepository
                                .countBySecurityOfficerIdAndScheduleId(officer.getId(), scheduleId);
                        if (currentMonthShifts >= 60)
                            continue;

                        validateConsecutiveWorkingDays(officer.getId(), currentDate, null);

                        if (!assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), officer.getId())) {
                            ShiftAssignment assignment = ShiftAssignment.builder()
                                    .shift(shift)
                                    .securityOfficer(officer)
                                    .clientCompanyName(officer.getAssignedCompany())
                                    .build();
                            assignmentRepository.save(assignment);
                            assignmentRepository.flush();
                            assignmentsAdded++;
                        }
                    } catch (RuntimeException e) {
                        // skip officer, try next
                    }
                }
            }
        }
    }

    // ── Officer-specific endpoints ─────────────────────────────────────────────

    @Transactional
    public ShiftScheduleDTO getOfficerCurrentSchedule(Long officerUserId, Integer month, Integer year) {
        User user = userRepository.findById(officerUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!"SECURITY_OFFICER".equals(user.getRole())) {
            throw new RuntimeException("User is not a security officer");
        }

        // Use users table as sole source of truth for company + designation
        String companyName = user.getAssignedCompany();
        String designation = user.getDesignation();

        if (companyName == null || companyName.isBlank()) {
            throw new RuntimeException("Officer is not assigned to any company");
        }

        Client client = resolveClientByName(companyName);

        ShiftSchedule schedule = scheduleRepository
                .findByClient_ClientIdAndMonthAndYear(client.getClientId(), month, year)
                .orElseThrow(() -> new RuntimeException(
                        "No schedule found for " + month + "/" + year + ". Please create a new draft."));

        boolean isJso = "JSO".equalsIgnoreCase(designation);
        if (!isJso && schedule.getStatus() != ScheduleStatus.APPROVED) {
            throw new RuntimeException("No schedule found for this period.");
        }

        return mapToDTO(schedule);
    }

    @Transactional
    public ShiftScheduleDTO createOfficerSchedule(Long officerUserId, Integer month, Integer year) {
        User user = userRepository.findById(officerUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Use users table as sole source of truth for company + designation
        String designation = user.getDesignation();
        String companyName = user.getAssignedCompany();

        if (!"JSO".equalsIgnoreCase(designation)) {
            throw new RuntimeException("Only JSO can create officer schedules");
        }
        if (companyName == null || companyName.isBlank()) {
            throw new RuntimeException("JSO is not assigned to any company");
        }

        Client client = resolveClientByName(companyName);

        CreateScheduleRequest request = new CreateScheduleRequest();
        request.setClientId(client.getClientId());
        request.setMonth(month);
        request.setYear(year);

        return createSchedule(request, officerUserId);
    }

    // ── Area Manager helper ────────────────────────────────────────────────────

    private User validateAreaManager(Long areaManagerUserId) {
        User areaManager = userRepository.findById(areaManagerUserId)
                .orElseThrow(() -> new RuntimeException("Area manager not found"));
        if (!"AREA_MANAGER".equals(areaManager.getRole())) {
            throw new RuntimeException("Only AREA_MANAGER can perform this action");
        }
        return areaManager;
    }

    private void assertAreaManagerHasAccess(User areaManager, ShiftSchedule schedule) {
        String assignedArea = areaManager.getAssignedArea();
        if (assignedArea == null || assignedArea.trim().isEmpty()) {
            throw new RuntimeException("Area manager does not have an assigned area configured.");
        }
        String clientCity = schedule.getClient().getCity();
        if (clientCity == null || !assignedArea.equalsIgnoreCase(clientCity)) {
            throw new RuntimeException(
                    "Access Denied: Client city '" + clientCity + "' does not match your assigned area '" + assignedArea + "'.");
        }
    }

    private ShiftSchedule validateAreaManagerScheduleAccess(Long scheduleId, Long areaManagerUserId) {
        User areaManager = validateAreaManager(areaManagerUserId);
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        assertAreaManagerHasAccess(areaManager, schedule);
        return schedule;
    }

    // ── Area Manager endpoints ─────────────────────────────────────────────────

    public List<ShiftScheduleDTO> getSubmittedSchedules(Long areaManagerUserId) {
        User areaManager = validateAreaManager(areaManagerUserId);
        String assignedArea = areaManager.getAssignedArea();
        if (assignedArea == null || assignedArea.trim().isEmpty()) {
            return List.of();
        }
        final String area = assignedArea.trim();
        return scheduleRepository.findByStatus(ScheduleStatus.SUBMITTED).stream()
                .filter(s -> s.getClient().getCity() != null && area.equalsIgnoreCase(s.getClient().getCity().trim()))
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getAreaManagerSchedulesForMonth(Long areaManagerUserId, Integer month, Integer year) {
        User areaManager = validateAreaManager(areaManagerUserId);
        String assignedArea = areaManager.getAssignedArea();
        if (assignedArea == null || assignedArea.trim().isEmpty()) {
            return List.of();
        }
        final String area = assignedArea.trim();
        return scheduleRepository
                .findByMonthAndYearAndStatusIn(month, year, List.of(ScheduleStatus.SUBMITTED, ScheduleStatus.APPROVED))
                .stream()
                .filter(s -> s.getClient().getCity() != null && area.equalsIgnoreCase(s.getClient().getCity().trim()))
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getAreaManagerApprovedHistory(Long areaManagerUserId, Integer month, Integer year) {
        User areaManager = validateAreaManager(areaManagerUserId);
        String assignedArea = areaManager.getAssignedArea();
        if (assignedArea == null || assignedArea.trim().isEmpty()) {
            return List.of();
        }
        final String area = assignedArea.trim();
        return scheduleRepository.findByMonthAndYearAndStatus(month, year, ScheduleStatus.APPROVED)
                .stream()
                .filter(s -> s.getClient().getCity() != null && area.equalsIgnoreCase(s.getClient().getCity().trim()))
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional
    public void assignOfficersToShiftAsAreaManager(Long scheduleId, AssignOfficerRequest request, Long areaManagerUserId) {
        ShiftSchedule schedule = validateAreaManagerScheduleAccess(scheduleId, areaManagerUserId);

        if (schedule.getStatus() != ScheduleStatus.SUBMITTED) {
            throw new RuntimeException("Area manager can edit only SUBMITTED schedules");
        }

        Shift shift = shiftRepository
                .findBySchedule_IdAndShiftDateAndShiftType(scheduleId, request.getDate(), request.getShiftType())
                .orElseGet(() -> shiftRepository.save(Shift.builder()
                        .schedule(schedule)
                        .shiftDate(request.getDate())
                        .shiftType(request.getShiftType())
                        .build()));

        Set<Long> uniqueOfficerIds = new HashSet<>(request.getSecurityOfficerIds());

        for (Long officerId : uniqueOfficerIds) {
            // officerId is users.id; bridge to security_officers via email
            SecurityOfficer officer = resolveSecurityOfficerByUserId(officerId);

            if (assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), officer.getId())) {
                throw new RuntimeException("Officer " + officerId + " is already assigned to this shift.");
            }

            long currentMonthShifts = assignmentRepository.countBySecurityOfficerIdAndScheduleId(officer.getId(), scheduleId);
            if (currentMonthShifts >= 60) {
                throw new RuntimeException("Officer " + officerId + " has exceeded the maximum of 60 shifts for the month.");
            }

            validateConsecutiveWorkingDays(officer.getId(), request.getDate(), null);

            ShiftAssignment assignment = ShiftAssignment.builder()
                    .shift(shift)
                    .securityOfficer(officer)
                    .clientCompanyName(officer.getAssignedCompany())
                    .build();
            assignmentRepository.save(assignment);
        }

        schedule.setEditedByAreaManager(true);
        schedule.setAreaManagerEditedAt(LocalDateTime.now());
        scheduleRepository.save(schedule);
    }

    @Transactional
    public void removeAssignmentAsAreaManager(Long assignmentId, Long areaManagerUserId) {
        User areaManager = validateAreaManager(areaManagerUserId);
        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        ShiftSchedule schedule = assignment.getShift().getSchedule();
        assertAreaManagerHasAccess(areaManager, schedule);

        if (schedule.getStatus() != ScheduleStatus.SUBMITTED && schedule.getStatus() != ScheduleStatus.APPROVED) {
            throw new RuntimeException("Area manager can edit only SUBMITTED or APPROVED schedules");
        }

        assignmentRepository.delete(assignment);
        schedule.setEditedByAreaManager(true);
        schedule.setAreaManagerEditedAt(LocalDateTime.now());
        scheduleRepository.save(schedule);
    }

    // ── Lookup by company & month/year (used by Area Manager JSO page) ─────────

    public ShiftScheduleDTO getScheduleByCompanyAndMonthAndYear(Integer clientId, Integer month, Integer year) {
        ShiftSchedule schedule = scheduleRepository
                .findByClient_ClientIdAndMonthAndYear(clientId, month, year)
                .orElseThrow(() -> new RuntimeException(
                        "No schedule found for client ID " + clientId + " for " + month + "/" + year + "."));
        return mapToDTO(schedule);
    }

    // ── Approved schedules (officer/executive views) ───────────────────────────

    public List<ShiftScheduleDTO> getApprovedSchedules() {
        return scheduleRepository.findByStatus(ScheduleStatus.APPROVED).stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getClientCurrentSchedules(Integer clientId) {
        return scheduleRepository.findByStatusAndClient_ClientId(ScheduleStatus.APPROVED, clientId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getApprovedSchedulesForOfficer(Long officerId) {
        return scheduleRepository.findByStatus(ScheduleStatus.APPROVED).stream()
                .filter(schedule -> assignmentRepository.findByShift_Schedule_Id(schedule.getId())
                        .stream()
                        .anyMatch(a -> a.getSecurityOfficer().getId().equals(officerId)))
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getFilteredSchedules(String clientIdParam, String month) {
        return scheduleRepository.findByStatus(ScheduleStatus.APPROVED).stream()
                .filter(s -> clientIdParam == null || clientIdParam.isBlank()
                        || String.valueOf(s.getClient().getClientId()).equals(clientIdParam))
                .filter(s -> month == null || month.isBlank()
                        || String.valueOf(s.getMonth()).equals(month))
                .map(this::mapToDTO)
                .toList();
    }

    // ── Validation helpers ─────────────────────────────────────────────────────

    private List<User> getAvailableOfficersForClient(String companyName) {
        return userRepository.findByRole("SECURITY_OFFICER").stream()
                .filter(u -> companyName.equalsIgnoreCase(u.getAssignedCompany()))
                .filter(u -> u.getIsActive() != null && u.getIsActive())
                .toList();
    }

    public void validateConsecutiveWorkingDays(Long officerId, LocalDate targetDate, Long excludeAssignmentId) {
        // Range: Check dates within +/- 6 days of the target date 
        // to detect any 7-day streaks it might complete.
        LocalDate startDate = targetDate.minusDays(6);
        LocalDate endDate = targetDate.plusDays(6);

        // [Rule] DISTINCT shift dates: Day + Night on same date = 1 day
        List<LocalDate> distinctDates = assignmentRepository.findDistinctShiftDatesByOfficerAndDateRange(officerId, startDate, endDate);
        Set<LocalDate> workingDates = new HashSet<>(distinctDates);

        // If editing an existing assignment, we'd normally handle excludeAssignmentId here.
        // For current creation/generation flows, this is null.
        if (excludeAssignmentId != null) {
            // Find and remove the date of the excluded assignment if it has no other shifts
            ShiftAssignment ex = assignmentRepository.findById(excludeAssignmentId).orElse(null);
            if (ex != null) {
                LocalDate exDate = ex.getShift().getShiftDate();
                // If there are other assignments on this date besides the one we're excluding,
                // the date still counts as a working day.
                boolean hasOthers = distinctDates.stream().anyMatch(d -> d.equals(exDate)) && 
                                   assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(ex.getShift().getId(), officerId);
                // Implementation note: Simple exists check is safer here than complex JPQL for this edge case.
                if (!hasOthers) {
                    workingDates.remove(exDate);
                }
            }
        }

        workingDates.add(targetDate);

        List<LocalDate> sortedDates = new ArrayList<>(workingDates);
        Collections.sort(sortedDates);

        int currentStreak = 0;
        int maxStreak = 0;

        if (!sortedDates.isEmpty()) {
            currentStreak = 1;
            maxStreak = 1;
            for (int i = 1; i < sortedDates.size(); i++) {
                if (sortedDates.get(i).equals(sortedDates.get(i - 1).plusDays(1))) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
                maxStreak = Math.max(maxStreak, currentStreak);
            }
        }

        if (maxStreak > 6) {
            throw new RuntimeException("Officer cannot work more than 6 consecutive days. 7th day must be OFF.");
        }
    }

    // ── DTO mapping ────────────────────────────────────────────────────────────

    private ShiftScheduleDTO mapToDTO(ShiftSchedule schedule) {
        List<Shift> shifts = shiftRepository.findBySchedule_Id(schedule.getId());

        // Bulk resolve SecurityOfficer -> User ID mapping via email
        Set<String> officerEmails = shifts.stream()
                .flatMap(s -> s.getAssignments() != null ? s.getAssignments().stream() : java.util.stream.Stream.empty())
                .map(a -> a.getSecurityOfficer().getEmailAddress())
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Long> emailToUserId = userRepository.findByEmailIn(officerEmails).stream()
                .collect(Collectors.toMap(User::getEmail, User::getId, (id1, id2) -> id1));

        List<ShiftDTO> shiftDTOs = shifts.stream()
                .map(s -> mapShiftToDTO(s, emailToUserId))
                .toList();

        return ShiftScheduleDTO.builder()
                .id(schedule.getId())
                .clientId(schedule.getClient().getClientId())
                .clientName(schedule.getClient().getCompanyName())
                .month(schedule.getMonth())
                .year(schedule.getYear())
                .status(schedule.getStatus())
                .submittedDate(schedule.getSubmittedDate())
                .approvedDate(schedule.getApprovedDate())
                .createdByUserName(schedule.getCreatedBy().getEmail())
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .editedByAreaManager(schedule.isEditedByAreaManager())
                .areaManagerEditedAt(schedule.getAreaManagerEditedAt())
                .shifts(shiftDTOs)
                .build();
    }

    private ShiftDTO mapShiftToDTO(Shift shift, Map<String, Long> emailToUserId) {
        List<ShiftAssignmentDTO> assignments = shift.getAssignments() == null
                ? List.of()
                : shift.getAssignments().stream()
                        .map(a -> mapAssignmentToDTO(a, emailToUserId))
                        .toList();

        return ShiftDTO.builder()
                .id(shift.getId())
                .scheduleId(shift.getSchedule().getId())
                .date(shift.getShiftDate())
                .shiftType(shift.getShiftType())
                .assignments(assignments)
                .build();
    }

    private ShiftAssignmentDTO mapAssignmentToDTO(ShiftAssignment assignment, Map<String, Long> emailToUserId) {
        // Resolve the User ID from the pre-fetched map using the bridge email
        Long userId = emailToUserId.get(assignment.getSecurityOfficer().getEmailAddress());

        return ShiftAssignmentDTO.builder()
                .id(assignment.getId())
                .shiftId(assignment.getShift().getId())
                .securityOfficerId(userId) // Return users.id to frontend
                .securityOfficerName(assignment.getSecurityOfficer().getFullName())
                .build();
    }
}
