package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.WeeklyReportDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.entity.Attendance;
import com.security.Ace.Front.Line.Security.Solutions.entity.Branch;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.ClientCompany;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftAssignment;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.WeeklyReport;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.AttendanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.BranchRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientCompanyRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ShiftAssignmentRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SecurityOfficerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.WeeklyReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WeeklyReportService {

    @Autowired
    private WeeklyReportRepository weeklyReportRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private SecurityOfficerRepository securityOfficerRepository;

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private ClientCompanyRepository clientCompanyRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private BranchRepository branchRepository;

    private boolean isAreaManagerRole(String role) {
        if (role == null) return false;
        String r = role.trim();
        return "AREA_MANAGER".equalsIgnoreCase(r) || "ROLE_AREA_MANAGER".equalsIgnoreCase(r);
    }

    private Branch resolveBranchForAreaManager(User user, String emailForError) {
        if (user.getBranch() != null) {
            return user.getBranch();
        }
        String assignedArea = user.getAssignedArea() != null ? user.getAssignedArea().trim() : "";
        if (!assignedArea.isBlank()) {
            Branch byArea = branchRepository.findAll().stream()
                    .filter(b -> b.getBranchName() != null && assignedArea.equalsIgnoreCase(b.getBranchName().trim()))
                    .findFirst()
                    .orElse(null);
            if (byArea != null) {
                return byArea;
            }
        }
        throw new RuntimeException("AREA_MANAGER user has no branch mapping. Set users.assigned_area to a valid branch name for email: " + emailForError);
    }

    /**
     * Resolves the AreaManager id by email (creates AreaManager from users if needed).
     * Falls back to a demo manager id when email is missing (dev convenience).
     */
    @Transactional
    public Long resolveOrCreateAreaManagerIdByEmailOrFallback(String areaManagerEmail, Long fallbackManagerId) {
        if (areaManagerEmail == null || areaManagerEmail.isBlank()) {
            return fallbackManagerId;
        }

        String email = areaManagerEmail.trim();

        AreaManager manager = areaManagerRepository.findByEmail(email)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("Area Manager not found in users table for email: " + email));

                    if (!isAreaManagerRole(user.getRole())) {
                        throw new RuntimeException("User is not AREA_MANAGER for email: " + email);
                    }

                    Branch resolvedBranch = resolveBranchForAreaManager(user, email);

                    AreaManager created = new AreaManager();
                    created.setEmail(user.getEmail());
                    created.setPassword(user.getPassword());
                    created.setBranch(resolvedBranch);
                    created.setFullName(user.getFullName() != null ? user.getFullName() : user.getEmail());
                    created.setEmployeeId(user.getUsername() != null ? user.getUsername() : String.valueOf(user.getId()));
                    created.setContactNumber(user.getMobileNumber() != null ? user.getMobileNumber() : "0000000000");
                    created.setDesignation(user.getDesignation() != null ? user.getDesignation() : "Area Manager");
                    created.setStatus("ACTIVE");
                    return areaManagerRepository.save(created);
                });

        return manager.getId();
    }

    /**
     * Company dropdown options for weekly reports.
     * - Source of truth: `clients` table (ACTIVE only)
     * - Area manager visibility is strictly limited to clients in assignedArea (city).
     */
    @Transactional(readOnly = true)
    public List<String> getWeeklyReportCompanyOptions(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return List.of();
        }

        User user = userRepository.findByEmail(userEmail.trim()).orElse(null);
        if (user == null) {
            return List.of();
        }

        String role = user.getRole() != null ? user.getRole().trim() : "";
        boolean isAreaManager = "AREA_MANAGER".equalsIgnoreCase(role)
                || "ROLE_AREA_MANAGER".equalsIgnoreCase(role);
        if (!isAreaManager) {
            return List.of();
        }

        String assignedArea = user.getAssignedArea() != null ? user.getAssignedArea().trim() : "";
        if (assignedArea.isBlank()) {
            return List.of();
        }

        // Compare in Java after trimming to handle DB values with trailing spaces.
        // Use all client rows (not only ACTIVE) because weekly report company dropdown
        // should reflect companies present in `clients` table for the assigned city.
        List<Client> clients = clientRepository.findAll()
                .stream()
                .filter(c -> c.getCity() != null && !c.getCity().isBlank())
                .filter(c -> assignedArea.equalsIgnoreCase(c.getCity().trim()))
                .sorted(java.util.Comparator.comparing(
                        c -> c.getCompanyName() == null ? "" : c.getCompanyName().toLowerCase()))
                .collect(Collectors.toList());

        return clients.stream()
                .map(Client::getCompanyName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getWeeklyReportCompanyOptionsForUser(User user) {
        if (user == null) {
            return List.of();
        }

        String role = user.getRole() != null ? user.getRole().trim() : "";
        boolean isAreaManager = "AREA_MANAGER".equalsIgnoreCase(role)
                || "ROLE_AREA_MANAGER".equalsIgnoreCase(role);
        if (!isAreaManager) {
            return List.of();
        }

        String assignedArea = user.getAssignedArea() != null ? user.getAssignedArea().trim() : "";
        if (assignedArea.isBlank()) {
            return List.of();
        }

        List<Client> clients = clientRepository.findAll()
                .stream()
                .filter(c -> c.getCity() != null && !c.getCity().isBlank())
                .filter(c -> assignedArea.equalsIgnoreCase(c.getCity().trim()))
                .sorted(java.util.Comparator.comparing(
                        c -> c.getCompanyName() == null ? "" : c.getCompanyName().toLowerCase()))
                .collect(Collectors.toList());

        return clients.stream()
                .map(Client::getCompanyName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Generates/updates weekly report totals based on the *actual shift assignments*
     * for a schedule.
     *
     * This is what makes weekly reports reflect the shift scheduling allocations
     * (client company + assigned officers on each date) instead of relying on attendance rows.
     */
    @Transactional
    public void upsertWeeklyReportsFromShiftSchedule(Long scheduleId, String areaManagerEmail) {
        if (areaManagerEmail == null || areaManagerEmail.isBlank()) {
            throw new RuntimeException("Area manager email is required to generate weekly reports.");
        }

        AreaManager manager = areaManagerRepository.findByEmail(areaManagerEmail.trim())
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(areaManagerEmail.trim())
                            .orElseThrow(() -> new RuntimeException("Area Manager not found in users table for email: " + areaManagerEmail));

                    if (!isAreaManagerRole(user.getRole())) {
                        throw new RuntimeException("User is not AREA_MANAGER for email: " + areaManagerEmail);
                    }

                    Branch resolvedBranch = resolveBranchForAreaManager(user, areaManagerEmail.trim());

                    // Create a minimal AreaManager row so weekly reports can reference it.
                    // This matches your current architecture where login/session is on `users` table.
                    AreaManager created = new AreaManager();
                    created.setEmail(user.getEmail());
                    created.setPassword(user.getPassword());
                    created.setBranch(resolvedBranch);
                    created.setFullName(user.getFullName() != null ? user.getFullName() : user.getEmail());
                    created.setEmployeeId(user.getUsername() != null ? user.getUsername() : String.valueOf(user.getId()));
                    created.setContactNumber(user.getMobileNumber() != null ? user.getMobileNumber() : "0000000000");
                    created.setDesignation(user.getDesignation() != null ? user.getDesignation() : "Area Manager");
                    created.setStatus("ACTIVE");
                    return areaManagerRepository.save(created);
                });

        List<ShiftAssignment> assignments = shiftAssignmentRepository.findByShift_Schedule_Id(scheduleId);
        if (assignments.isEmpty()) {
            return;
        }

        // securityOfficerId|year|month|weekNumber -> number of assignment rows (DAY+NIGHT can be 2 on same date)
        java.util.Map<String, Integer> shiftCounts = new java.util.HashMap<>();
        java.util.Map<String, LocalDate> weekStartByKey = new java.util.HashMap<>();

        for (ShiftAssignment a : assignments) {
            SecurityOfficer securityOfficer = a.getSecurityOfficer();
            LocalDate date = a.getShift().getShiftDate();
            if (securityOfficer == null || date == null) continue;

            int year = date.getYear();
            int month = date.getMonthValue();
            int dayOfMonth = date.getDayOfMonth();
            int weekNumber = Math.min(4, (dayOfMonth - 1) / 7 + 1);

            int weekStartDay = (weekNumber - 1) * 7 + 1;
            LocalDate weekStart = LocalDate.of(year, month, weekStartDay);

            Long securityOfficerId = securityOfficer.getId();
            String key = securityOfficerId + "|" + year + "|" + month + "|" + weekNumber;
            shiftCounts.merge(key, 1, Integer::sum);
            weekStartByKey.putIfAbsent(key, weekStart);
        }

        String clientCompanyName = assignments.get(0).getShift().getSchedule().getClient().getCompanyName();

        for (String key : shiftCounts.keySet()) {
            LocalDate weekStart = weekStartByKey.get(key);
            String[] parts = key.split("\\|");
            Long securityOfficerId = Long.parseLong(parts[0]);
            securityOfficerRepository.findById(securityOfficerId)
                    .orElseThrow(() -> new RuntimeException("Security officer not found: " + securityOfficerId));
            // Shifts from schedule; hours/OT from attendance rows for those scheduled days.
            generateWeeklyReportInternal(securityOfficerId, manager.getId(), weekStart, clientCompanyName);
        }
    }

    @Transactional
    public WeeklyReportDTO generateWeeklyReport(Long officerId, Long managerId, LocalDate weekDate) {
        SecurityOfficer officer = securityOfficerRepository.findById(officerId)
                .orElseThrow(() -> new RuntimeException("Security Officer not found"));

        // Default generation (officer-level) uses the officer's assigned company.
        // Company-level generation uses the schedule's client company name.
        String clientCompanyName = officer.getAssignedCompany();
        return generateWeeklyReportInternal(officerId, managerId, weekDate, clientCompanyName);
    }

    @Transactional
    protected WeeklyReportDTO generateWeeklyReportInternal(Long officerId,
                                                              Long managerId,
                                                              LocalDate weekDate,
                                                              String clientCompanyName) {
        SecurityOfficer officer = securityOfficerRepository.findById(officerId)
                .orElseThrow(() -> new RuntimeException("Security Officer not found"));

        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        // Week of month: 1 = 1-7, 2 = 8-14, 3 = 15-21, 4 = 22 to end of month (same for every month)
        int year = weekDate.getYear();
        int month = weekDate.getMonthValue();
        int dayOfMonth = weekDate.getDayOfMonth();
        int weekNumber = Math.min(4, (dayOfMonth - 1) / 7 + 1);
        int weekStartDay = (weekNumber - 1) * 7 + 1;
        int lastDayOfMonth = LocalDate.of(year, month, 1).lengthOfMonth();
        int weekEndDay = weekNumber < 4 ? weekNumber * 7 : lastDayOfMonth;
        LocalDate weekStart = LocalDate.of(year, month, weekStartDay);
        LocalDate weekEnd = LocalDate.of(year, month, weekEndDay);

        // Generate totals from shift assignments (not attendance).
        // Filter by the selected client company so totals match the selected company.
        // Note: this returns one row per assignment record. If the officer is assigned to both
        // DAY and NIGHT on the same date, the date can appear twice (which matches "shift" count).
        List<LocalDate> assignedShiftDates = shiftAssignmentRepository
                .findWorkingDatesByOfficerAndCompanyAndDateRange(officerId, clientCompanyName, weekStart, weekEnd);

        int totalShifts = assignedShiftDates == null ? 0 : assignedShiftDates.size();
        List<LocalDate> distinctScheduleDates = distinctDates(assignedShiftDates);
        double totalHoursWorked = sumAttendanceHoursForScheduledDates(officerId, distinctScheduleDates);
        double totalOvertimeHours = sumAttendanceOvertimeForScheduledDates(officerId, distinctScheduleDates);

        // Check if report already exists (by officer, company, year, month, week of month).
        // For older rows where `clientCompanyName` might be NULL, fall back to the
        // old key (without client company) and then set the company value.
        WeeklyReport report = weeklyReportRepository
                .findBySecurityOfficerIdAndYearAndMonthAndWeekNumberAndClientCompanyName(
                        officerId, year, month, weekNumber, clientCompanyName)
                .orElseGet(() -> weeklyReportRepository
                        .findBySecurityOfficerIdAndYearAndMonthAndWeekNumber(
                                officerId, year, month, weekNumber)
                        .orElse(new WeeklyReport()));

        report.setSecurityOfficer(officer);
        report.setAreaManager(manager);
        report.setWeekNumber(weekNumber);
        report.setMonth(month);
        report.setYear(year);
        report.setWeekStartDate(weekStart);
        report.setWeekEndDate(weekEnd);
        report.setClientCompanyName(clientCompanyName);
        report.setTotalShifts(totalShifts);
        report.setTotalOvertimeHours(totalOvertimeHours);
        report.setTotalHoursWorked(totalHoursWorked);
        report.setGeneratedDate(LocalDate.now());

        WeeklyReport saved = weeklyReportRepository.save(report);
        return convertToDTO(saved);
    }

    /**
     * Generate/update weekly report rows for an officer for the week in question.
     *
     * Important:
     * - totalShifts always comes from APPROVED shift scheduling (schedule assignments)
     * - totalHoursWorked and totalOvertimeHours come from attendance for the scheduled dates
     *
     * This method determines the correct client company(s) from the APPROVED shift schedule
     * for that week, so attendance-driven refresh writes into the same weekly report rows
     * the UI filters by.
     */
    @Transactional
    public List<WeeklyReportDTO> generateWeeklyReportsForOfficerAndWeek(
            Long officerId,
            Long managerId,
            LocalDate weekDate) {

        if (officerId == null || managerId == null || weekDate == null) {
            throw new RuntimeException("officerId, managerId and weekDate are required");
        }

        // Compute week range (same logic as generateWeeklyReportInternal).
        int year = weekDate.getYear();
        int month = weekDate.getMonthValue();
        int dayOfMonth = weekDate.getDayOfMonth();
        int weekNumber = Math.min(4, (dayOfMonth - 1) / 7 + 1);
        int weekStartDay = (weekNumber - 1) * 7 + 1;
        int lastDayOfMonth = LocalDate.of(year, month, 1).lengthOfMonth();
        int weekEndDay = weekNumber < 4 ? weekNumber * 7 : lastDayOfMonth;
        LocalDate weekStart = LocalDate.of(year, month, weekStartDay);
        LocalDate weekEnd = LocalDate.of(year, month, weekEndDay);

        List<String> companies = shiftAssignmentRepository
                .findDistinctClientCompanyNamesByOfficerAndDateRangeOnApprovedSchedules(officerId, weekStart, weekEnd);

        if (companies == null || companies.isEmpty()) {
            // Fallback: no APPROVED schedule assignments -> use officer assigned company
            SecurityOfficer officer = securityOfficerRepository.findById(officerId)
                    .orElseThrow(() -> new RuntimeException("Security Officer not found"));
            return List.of(generateWeeklyReportInternal(officerId, managerId, weekDate, officer.getAssignedCompany()));
        }

        return companies.stream()
                .map(companyName -> generateWeeklyReportInternal(officerId, managerId, weekDate, companyName))
                .collect(Collectors.toList());
    }

    /**
     * After attendance is recorded, update only OT/hours totals in existing weekly report rows
     * for the officer+week (preserves existing companyName so UI filtering doesn't lose rows).
     *
     * If no rows exist yet for that officer+week, we generate them from APPROVED schedules.
     */
    @Transactional
    public void refreshWeeklyReportTotalsFromAttendance(
            Long officerId,
            Long managerId,
            LocalDate attendanceDate) {

        if (officerId == null || managerId == null || attendanceDate == null) {
            throw new RuntimeException("officerId, managerId and attendanceDate are required");
        }

        int year = attendanceDate.getYear();
        int month = attendanceDate.getMonthValue();
        int dayOfMonth = attendanceDate.getDayOfMonth();
        int weekNumber = Math.min(4, (dayOfMonth - 1) / 7 + 1);
        int weekStartDay = (weekNumber - 1) * 7 + 1;
        int lastDayOfMonth = LocalDate.of(year, month, 1).lengthOfMonth();
        int weekEndDay = weekNumber < 4 ? weekNumber * 7 : lastDayOfMonth;

        LocalDate weekStart = LocalDate.of(year, month, weekStartDay);
        LocalDate weekEnd = LocalDate.of(year, month, weekEndDay);

        // Update the already-existing rows (keeps companyName consistent).
        List<WeeklyReport> existing = weeklyReportRepository
                .findByAreaManagerIdAndSecurityOfficerIdAndYearAndMonthAndWeekNumber(
                        managerId, officerId, year, month, weekNumber);

        if (existing == null || existing.isEmpty()) {
            // Nothing exists yet for this officer/week; generate from approved schedules.
            generateWeeklyReportsForOfficerAndWeek(officerId, managerId, attendanceDate);
            existing = weeklyReportRepository
                    .findByAreaManagerIdAndSecurityOfficerIdAndYearAndMonthAndWeekNumber(
                            managerId, officerId, year, month, weekNumber);
        } else {
            // Ensure we have rows for every company the officer is scheduled on this week.
            // This prevents "only one officer missing" cases where the weekly report row
            // was never generated for that company/week.
            List<String> scheduledCompanies = shiftAssignmentRepository
                    .findDistinctClientCompanyNamesByOfficerAndDateRangeOnApprovedSchedules(
                            officerId, weekStart, weekEnd);
            if (scheduledCompanies != null && !scheduledCompanies.isEmpty()) {
                java.util.Set<String> existingCompanies = new java.util.HashSet<>();
                for (WeeklyReport r : existing) {
                    if (r.getClientCompanyName() != null) {
                        existingCompanies.add(r.getClientCompanyName());
                    }
                }
                for (String company : scheduledCompanies) {
                    if (company == null || company.isBlank()) continue;
                    if (!existingCompanies.contains(company)) {
                        generateWeeklyReportInternal(officerId, managerId, attendanceDate, company);
                    }
                }
                existing = weeklyReportRepository
                        .findByAreaManagerIdAndSecurityOfficerIdAndYearAndMonthAndWeekNumber(
                                managerId, officerId, year, month, weekNumber);
            }
        }

        if (existing == null || existing.isEmpty()) {
            return;
        }

        for (WeeklyReport report : existing) {
            String companyName = report.getClientCompanyName() != null
                    ? report.getClientCompanyName()
                    : report.getSecurityOfficer().getAssignedCompany();

            List<LocalDate> assignedShiftDates = shiftAssignmentRepository
                    .findWorkingDatesByOfficerAndCompanyAndDateRange(
                            officerId, companyName, weekStart, weekEnd);
            List<LocalDate> distinctScheduleDates = distinctDates(assignedShiftDates);

            double totalHoursWorked = sumAttendanceHoursForScheduledDates(officerId, distinctScheduleDates);
            double totalOvertimeHours = sumAttendanceOvertimeForScheduledDates(officerId, distinctScheduleDates);

            report.setTotalHoursWorked(totalHoursWorked);
            report.setTotalOvertimeHours(totalOvertimeHours);
            // Treat attendance refresh as re-generation moment for ordering/troubleshooting.
            report.setGeneratedDate(LocalDate.now());
            weeklyReportRepository.save(report);
        }
    }

    /**
     * Generate weekly reports for all active officers in a given company for the specified manager and week.
     * This still stores one WeeklyReport per officer, but the caller treats it as a "company report"
     * consisting of multiple officer-level rows.
     */
    @Transactional
    public List<WeeklyReportDTO> generateWeeklyReportsForCompany(Long managerId,
                                                                 String companyName,
                                                                 LocalDate weekDate) {
        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));
        if (manager.getBranch() == null) {
            throw new RuntimeException("Area manager is not assigned to any branch");
        }

        int year = weekDate.getYear();
        int month = weekDate.getMonthValue();
        int dayOfMonth = weekDate.getDayOfMonth();
        int weekNumber = Math.min(4, (dayOfMonth - 1) / 7 + 1);

        int weekStartDay = (weekNumber - 1) * 7 + 1;
        int lastDayOfMonth = LocalDate.of(year, month, 1).lengthOfMonth();
        int weekEndDay = weekNumber < 4 ? weekNumber * 7 : lastDayOfMonth;

        LocalDate weekStart = LocalDate.of(year, month, weekStartDay);
        LocalDate weekEnd = LocalDate.of(year, month, weekEndDay);

        // Build report rows from APPROVED shift allocations, filtered to the Area Manager's branch.
        // Do NOT rely on SecurityOfficer.areaManager mapping, because in your flow weekly reports
        // should follow the schedule approvals (approved schedule belongs to the manager/branch),
        // not the officer's historical areaManager FK.
        List<SecurityOfficer> officers = shiftAssignmentRepository
                .findDistinctOfficersByBranchAndCompanyAndDateRange(
                        manager.getBranch().getId(),
                        companyName,
                        weekStart,
                        weekEnd
                );

        return officers.stream()
                .map(officer -> generateWeeklyReportInternal(officer.getId(), managerId, weekDate, companyName))
                .collect(Collectors.toList());
    }

    public List<WeeklyReportDTO> getReportsByManager(Long managerId) {
        return weeklyReportRepository.findByAreaManagerIdOrderByGeneratedDateDescWeekStartDateDescIdDesc(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Weekly reports from all area managers (read-only view for operational management).
     */
    public List<WeeklyReportDTO> getAllReportsForOperationalView() {
        return weeklyReportRepository.findAllByOrderByGeneratedDateDescWeekStartDateDescIdDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<WeeklyReportDTO> getReportsByManagerAndYear(Long managerId, Integer year) {
        return weeklyReportRepository.findByManagerAndYear(managerId, year).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get weekly reports for a specific company and week (for the CRUD section).
     * If weekDate is null, returns all reports for that company (all weeks).
     */
    public List<WeeklyReportDTO> getReportsByManagerCompanyAndWeek(Long managerId, String companyName, LocalDate weekDate) {
        List<WeeklyReportDTO> all = getReportsByManager(managerId);
        java.util.function.Predicate<WeeklyReportDTO> byCompany = dto ->
                companyName != null && companyName.equals(dto.getCompanyName());
        if (weekDate == null) {
            return all.stream().filter(byCompany).collect(Collectors.toList());
        }
        // Week of month: 1-7 -> 1, 8-14 -> 2, 15-21 -> 3, 22-end -> 4
        int year = weekDate.getYear();
        int month = weekDate.getMonthValue();
        int dayOfMonth = weekDate.getDayOfMonth();
        int weekNumber = Math.min(4, (dayOfMonth - 1) / 7 + 1);
        final int filterYear = year;
        final int filterMonth = month;
        final int filterWeek = weekNumber;
        return all.stream()
                .filter(byCompany)
                .filter(dto -> dto.getYear() != null && dto.getYear() == filterYear
                        && dto.getMonth() != null && dto.getMonth() == filterMonth
                        && dto.getWeekNumber() != null && dto.getWeekNumber() == filterWeek)
                .collect(Collectors.toList());
    }

    public WeeklyReportDTO getReportById(Long id) {
        WeeklyReport report = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Weekly report not found"));
        return convertToDTO(report);
    }

    @Transactional
    public WeeklyReportDTO updateWeeklyReport(Long id, WeeklyReportDTO dto) {
        WeeklyReport report = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Weekly report not found"));
        // Important: totals are derived values.
        // - totalShifts comes from APPROVED shift scheduling assignments
        // - totalHoursWorked and totalOvertimeHours come from attendance for scheduled dates
        // So the only editable field in Weekly Reports is remarks.
        if (dto.getRemarks() != null) {
            report.setRemarks(dto.getRemarks());
        }
        WeeklyReport saved = weeklyReportRepository.save(report);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteWeeklyReport(Long id) {
        if (!weeklyReportRepository.existsById(id)) {
            throw new RuntimeException("Weekly report not found");
        }
        weeklyReportRepository.deleteById(id);
    }

    private static List<LocalDate> distinctDates(List<LocalDate> dates) {
        if (dates == null || dates.isEmpty()) {
            return List.of();
        }
        return new ArrayList<>(new LinkedHashSet<>(dates));
    }

    private double sumAttendanceHoursForScheduledDates(Long officerId, List<LocalDate> scheduledDates) {
        if (scheduledDates == null || scheduledDates.isEmpty()) {
            return 0.0;
        }
        Double v = attendanceRepository.sumHoursWorkedByOfficerOnDates(officerId, scheduledDates);
        return v != null ? v : 0.0;
    }

    private double sumAttendanceOvertimeForScheduledDates(Long officerId, List<LocalDate> scheduledDates) {
        if (scheduledDates == null || scheduledDates.isEmpty()) {
            return 0.0;
        }
        Double v = attendanceRepository.sumOvertimeHoursByOfficerOnDates(officerId, scheduledDates);
        return v != null ? v : 0.0;
    }

    private WeeklyReportDTO convertToDTO(WeeklyReport report) {
        WeeklyReportDTO dto = new WeeklyReportDTO();
        dto.setId(report.getId());
        dto.setSecurityOfficerName(report.getSecurityOfficer().getFullName());
        dto.setSecurityId(report.getSecurityOfficer().getSecurityId());
        String companyName = report.getClientCompanyName() != null
                ? report.getClientCompanyName()
                : report.getSecurityOfficer().getAssignedCompany();
        dto.setCompanyName(companyName);

        // Branch should reflect the client company (not the officer's legacy branch string).
        String branchName = null;
        if (companyName != null && !companyName.isBlank()) {
            ClientCompany cc = clientCompanyRepository.findByCompanyNameIgnoreCase(companyName.trim()).orElse(null);
            if (cc != null && cc.getBranch() != null) {
                branchName = cc.getBranch().getBranchName();
            }
        }
        dto.setBranch(branchName);
        dto.setTotalShifts(report.getTotalShifts());
        dto.setTotalOvertimeHours(report.getTotalOvertimeHours());
        dto.setTotalHoursWorked(report.getTotalHoursWorked());
        dto.setAreaManagerName(report.getAreaManager().getFullName());
        dto.setAreaManagerEmployeeId(report.getAreaManager().getEmployeeId());
        dto.setWeekStartDate(report.getWeekStartDate());
        dto.setWeekEndDate(report.getWeekEndDate());
        dto.setWeekNumber(report.getWeekNumber());
        dto.setMonth(report.getMonth());
        dto.setYear(report.getYear());
        dto.setRemarks(report.getRemarks());
        return dto;
    }
}
