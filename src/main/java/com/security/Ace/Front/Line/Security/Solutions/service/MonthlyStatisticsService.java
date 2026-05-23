package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.MonthlyStatisticsDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.entity.Attendance;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftAssignment;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.MonthlyStatistics;
import com.security.Ace.Front.Line.Security.Solutions.repository.AttendanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ShiftAssignmentRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.MonthlyStatisticsRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SecurityOfficerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MonthlyStatisticsService {

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private MonthlyStatisticsRepository monthlyStatisticsRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityOfficerRepository securityOfficerRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private WeeklyReportService weeklyReportService;

    @Transactional
    public List<MonthlyStatisticsDTO> getMonthlyStatistics(Long managerId, int month, int year) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate monthStart = ym.atDay(1);
        LocalDate monthEnd = ym.atEndOfMonth();

        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new IllegalArgumentException("Area Manager not found: " + managerId));

        String assignedArea = userRepository.findByEmail(manager.getEmail())
                .map(User::getAssignedArea)
                .map(String::trim)
                .orElseGet(() -> manager.getBranch() != null && manager.getBranch().getBranchName() != null
                        ? manager.getBranch().getBranchName().trim()
                        : "");

        if (assignedArea.isBlank()) {
            return new ArrayList<>();
        }

        List<Client> areaClients = clientRepository.findAll().stream()
                .filter(c -> c.getCity() != null && !c.getCity().isBlank())
                .filter(c -> assignedArea.equalsIgnoreCase(c.getCity().trim()))
                .collect(Collectors.toList());
        java.util.Set<String> areaCompanyNames = areaClients.stream()
                .map(Client::getCompanyName)
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        if (areaCompanyNames.isEmpty()) {
            return new ArrayList<>();
        }

        // Base list: ACTIVE officers assigned to companies in this area.
        List<SecurityOfficer> activeOfficers = securityOfficerRepository.findByStatus("ACTIVE").stream()
                .filter(o -> o != null && "ACTIVE".equalsIgnoreCase(o.getStatus()))
                .filter(o -> o.getAssignedCompany() != null && !o.getAssignedCompany().isBlank())
                .filter(o -> areaCompanyNames.contains(o.getAssignedCompany().trim().toLowerCase()))
                .collect(Collectors.toList());

        Map<Long, MonthlyStatisticsDTO> byOfficer = new LinkedHashMap<>();
        Map<Long, SecurityOfficer> officerById = new LinkedHashMap<>();
        for (SecurityOfficer officer : activeOfficers) {
            Long officerId = officer.getId();
            if (officerId == null) continue;
            MonthlyStatisticsDTO m = new MonthlyStatisticsDTO();
            m.setSecurityId(officer.getSecurityId());
            m.setOfficerName(officer.getFullName());
            m.setMonthlyShifts(0);
            m.setMonthlyOvertimeHours(0.0);
            m.setMonthlyTotalHoursWorked(0.0);
            byOfficer.put(officerId, m);
            officerById.put(officerId, officer);
        }

        // Monthly shifts come from APPROVED shift assignments in the manager's assigned area.
        // Each ShiftAssignment row corresponds to one scheduled shift (DAY or NIGHT) for the officer.
        List<ShiftAssignment> approvedAssignments =
                shiftAssignmentRepository.findApprovedAssignmentsByAssignedAreaAndDateRange(
                        assignedArea, monthStart, monthEnd);
        for (ShiftAssignment a : approvedAssignments) {
            SecurityOfficer officer = a.getSecurityOfficer();
            if (officer == null || officer.getId() == null) continue;
            MonthlyStatisticsDTO dto = byOfficer.get(officer.getId());
            if (dto == null) {
                // Officer might not be ACTIVE but still scheduled in this area; include it.
                MonthlyStatisticsDTO m = new MonthlyStatisticsDTO();
                m.setSecurityId(officer.getSecurityId());
                m.setOfficerName(officer.getFullName());
                m.setMonthlyShifts(0);
                m.setMonthlyOvertimeHours(0.0);
                m.setMonthlyTotalHoursWorked(0.0);
                byOfficer.put(officer.getId(), m);
                officerById.putIfAbsent(officer.getId(), officer);
                dto = m;
            }
            dto.setMonthlyShifts(dto.getMonthlyShifts() + 1);
        }

        // OT hours come from attendance overtimeHours for the same month.
        List<Attendance> attendance = attendanceRepository.findByAttendanceDateBetween(monthStart, monthEnd);
        Map<Long, Double> overtimeByOfficerId = new LinkedHashMap<>();
        Map<Long, Double> totalHoursByOfficerId = new LinkedHashMap<>();
        for (Attendance a : attendance) {
            if (a == null || a.getSecurityOfficer() == null || a.getSecurityOfficer().getId() == null) continue;
            Long officerId = a.getSecurityOfficer().getId();
            if (!byOfficer.containsKey(officerId)) continue;
            Double ot = a.getOvertimeHours();
            if (ot == null) ot = 0.0;
            overtimeByOfficerId.merge(officerId, ot, Double::sum);

            Double hoursWorked = a.getHoursWorked();
            if (hoursWorked == null) hoursWorked = 0.0;
            totalHoursByOfficerId.merge(officerId, hoursWorked, Double::sum);
        }

        // Replace persisted rows for this manager+month+year.
        monthlyStatisticsRepository.deleteByAreaManagerIdAndMonthAndYear(managerId, month, year);

        LocalDateTime now = LocalDateTime.now();
        List<MonthlyStatistics> entities = new ArrayList<>();
        for (Map.Entry<Long, MonthlyStatisticsDTO> entry : byOfficer.entrySet()) {
            Long officerId = entry.getKey();
            MonthlyStatisticsDTO dto = entry.getValue();

            SecurityOfficer officer = officerById.get(officerId);
            if (officer == null) continue;

            Double monthlyOt = overtimeByOfficerId.get(officerId);
            dto.setMonthlyOvertimeHours(monthlyOt != null ? monthlyOt : 0.0);
            Double monthlyTotalHours = totalHoursByOfficerId.get(officerId);
            dto.setMonthlyTotalHoursWorked(monthlyTotalHours != null ? monthlyTotalHours : 0.0);

            MonthlyStatistics stats = new MonthlyStatistics();
            stats.setAreaManager(manager);
            stats.setSecurityOfficer(officer);
            stats.setMonth(month);
            stats.setYear(year);
            stats.setMonthlyShifts(dto.getMonthlyShifts());
            stats.setMonthlyOvertimeHours(dto.getMonthlyOvertimeHours());
            stats.setMonthlyTotalHoursWorked(dto.getMonthlyTotalHoursWorked());
            stats.setGeneratedAt(now);

            entities.add(stats);
        }

        if (entities.isEmpty()) {
            return new ArrayList<>();
        }

        List<MonthlyStatistics> saved = monthlyStatisticsRepository.saveAll(entities);
        List<MonthlyStatisticsDTO> result = new ArrayList<>();

        for (MonthlyStatistics s : saved) {
            if (s.getSecurityOfficer() == null) continue;

            MonthlyStatisticsDTO dto = new MonthlyStatisticsDTO();
            dto.setId(s.getId());
            dto.setSecurityId(s.getSecurityOfficer().getSecurityId());
            dto.setOfficerName(s.getSecurityOfficer().getFullName());
            dto.setMonthlyShifts(s.getMonthlyShifts());
            dto.setMonthlyOvertimeHours(s.getMonthlyOvertimeHours());
            dto.setMonthlyTotalHoursWorked(s.getMonthlyTotalHoursWorked());
            result.add(dto);
        }

        return result;
    }

    @Transactional
    public MonthlyStatisticsDTO updateMonthlyStatistics(Long id, Integer monthlyShifts, Double monthlyOvertimeHours) {
        MonthlyStatistics stats = monthlyStatisticsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Monthly statistics not found: " + id));

        // monthlyShifts is derived from APPROVED shift schedules and must not be manually edited.
        if (monthlyOvertimeHours != null) {
            stats.setMonthlyOvertimeHours(monthlyOvertimeHours);
        }

        stats.setGeneratedAt(LocalDateTime.now());
        MonthlyStatistics saved = monthlyStatisticsRepository.save(stats);

        MonthlyStatisticsDTO dto = new MonthlyStatisticsDTO();
        dto.setId(saved.getId());
        dto.setSecurityId(saved.getSecurityOfficer() != null ? saved.getSecurityOfficer().getSecurityId() : null);
        dto.setOfficerName(saved.getSecurityOfficer() != null ? saved.getSecurityOfficer().getFullName() : null);
        dto.setMonthlyShifts(saved.getMonthlyShifts());
        dto.setMonthlyOvertimeHours(saved.getMonthlyOvertimeHours());
        dto.setMonthlyTotalHoursWorked(saved.getMonthlyTotalHoursWorked());
        return dto;
    }

    @Transactional
    public void deleteMonthlyStatistics(Long id) {
        if (!monthlyStatisticsRepository.existsById(id)) {
            throw new IllegalArgumentException("Monthly statistics not found: " + id);
        }
        monthlyStatisticsRepository.deleteById(id);
    }

    /**
     * Used by shift scheduling approval flow. Finds the AreaManager in `area_managers`
     * by email, or creates it from `users` if missing, then recalculates stats.
     */
    @Transactional
    public void refreshMonthlyStatisticsForAreaManagerEmail(String areaManagerEmail, int month, int year) {
        if (areaManagerEmail == null || areaManagerEmail.isBlank()) return;
        Long managerId = weeklyReportService.resolveOrCreateAreaManagerIdByEmailOrFallback(areaManagerEmail.trim(), null);
        if (managerId == null) return;
        getMonthlyStatistics(managerId, month, year);
    }

    /**
     * Monthly statistics for the currently logged-in area manager (or a created AreaManager row).
     * This is used by the frontend so it does not rely on a hardcoded managerId.
     */
    @Transactional
    public List<MonthlyStatisticsDTO> getMonthlyStatisticsForAreaManagerEmail(String areaManagerEmail, int month, int year) {
        if (areaManagerEmail == null || areaManagerEmail.isBlank()) {
            return List.of();
        }
        Long managerId = weeklyReportService.resolveOrCreateAreaManagerIdByEmailOrFallback(areaManagerEmail.trim(), null);
        if (managerId == null) {
            return List.of();
        }
        return getMonthlyStatistics(managerId, month, year);
    }

    @Transactional(readOnly = true)
    public List<MonthlyStatisticsDTO> getMonthlyStatisticsForAllManagers(int month, int year) {
        // Account Executive view: global monthly stats across all area managers.
        // No area-manager id filtering here.
        YearMonth ym = YearMonth.of(year, month);
        LocalDate monthStart = ym.atDay(1);
        LocalDate monthEnd = ym.atEndOfMonth();

        Map<Long, MonthlyStatisticsDTO> byOfficer = new LinkedHashMap<>();

        // Start with all active officers so the page shows complete coverage.
        List<SecurityOfficer> activeOfficers = securityOfficerRepository.findByStatus("ACTIVE").stream()
                .filter(o -> o != null && o.getId() != null)
                .collect(Collectors.toList());
        for (SecurityOfficer officer : activeOfficers) {
            MonthlyStatisticsDTO dto = new MonthlyStatisticsDTO();
            dto.setId(null);
            dto.setSecurityId(officer.getSecurityId());
            dto.setOfficerName(officer.getFullName());
            dto.setMonthlyShifts(0);
            dto.setMonthlyOvertimeHours(0.0);
            dto.setMonthlyTotalHoursWorked(0.0);
            byOfficer.put(officer.getId(), dto);
        }

        // Monthly shifts from APPROVED shift assignments (all areas/managers).
        List<ShiftAssignment> approvedAssignments =
                shiftAssignmentRepository.findApprovedAssignmentsByDateRange(monthStart, monthEnd);
        for (ShiftAssignment a : approvedAssignments) {
            SecurityOfficer officer = a.getSecurityOfficer();
            if (officer == null || officer.getId() == null) continue;
            MonthlyStatisticsDTO dto = byOfficer.get(officer.getId());
            if (dto == null) {
                dto = new MonthlyStatisticsDTO();
                dto.setId(null);
                dto.setSecurityId(officer.getSecurityId());
                dto.setOfficerName(officer.getFullName());
                dto.setMonthlyShifts(0);
                dto.setMonthlyOvertimeHours(0.0);
                dto.setMonthlyTotalHoursWorked(0.0);
                byOfficer.put(officer.getId(), dto);
            }
            dto.setMonthlyShifts(dto.getMonthlyShifts() + 1);
        }

        // OT + total hours from attendance for the same month.
        List<Attendance> attendance = attendanceRepository.findByAttendanceDateBetween(monthStart, monthEnd);
        for (Attendance a : attendance) {
            if (a == null || a.getSecurityOfficer() == null || a.getSecurityOfficer().getId() == null) continue;
            Long officerId = a.getSecurityOfficer().getId();
            MonthlyStatisticsDTO dto = byOfficer.get(officerId);
            if (dto == null) {
                SecurityOfficer officer = a.getSecurityOfficer();
                dto = new MonthlyStatisticsDTO();
                dto.setId(null);
                dto.setSecurityId(officer.getSecurityId());
                dto.setOfficerName(officer.getFullName());
                dto.setMonthlyShifts(0);
                dto.setMonthlyOvertimeHours(0.0);
                dto.setMonthlyTotalHoursWorked(0.0);
                byOfficer.put(officerId, dto);
            }
            dto.setMonthlyOvertimeHours(dto.getMonthlyOvertimeHours() + (a.getOvertimeHours() != null ? a.getOvertimeHours() : 0.0));
            dto.setMonthlyTotalHoursWorked(dto.getMonthlyTotalHoursWorked() + (a.getHoursWorked() != null ? a.getHoursWorked() : 0.0));
        }

        List<MonthlyStatisticsDTO> all = new ArrayList<>(byOfficer.values());
        all.sort((a, b) -> {
            String an = a.getOfficerName() != null ? a.getOfficerName() : "";
            String bn = b.getOfficerName() != null ? b.getOfficerName() : "";
            return an.compareToIgnoreCase(bn);
        });
        return all;
    }
}

