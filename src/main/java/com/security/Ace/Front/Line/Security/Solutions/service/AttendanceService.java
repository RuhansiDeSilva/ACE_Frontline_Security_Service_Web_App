package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.AttendanceDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Attendance;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftAssignment;
import com.security.Ace.Front.Line.Security.Solutions.repository.AttendanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ShiftAssignmentRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SecurityOfficerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private SecurityOfficerRepository securityOfficerRepository;

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    @Lazy
    private WeeklyReportService weeklyReportService;

    private static final int MAX_SHIFTS_PER_MONTH = 60;
    // A shift lasts 12 hours. Overtime is calculated as: max(0, hoursWorked - 12).
    private static final double STANDARD_SHIFT_HOURS = 12.0;
    private static final double MAX_OT_HOURS_PER_MONTH = 180.0;

    @Transactional
    public AttendanceDTO createAttendance(AttendanceDTO dto, Long managerId) {
        SecurityOfficer officer = securityOfficerRepository.findById(dto.getSecurityOfficerId())
                .orElseThrow(() -> new RuntimeException("Security Officer not found"));

        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        // Check if attendance already exists for this date
        if (attendanceRepository.findBySecurityOfficerAndAttendanceDate(officer, dto.getAttendanceDate()).isPresent()) {
            throw new RuntimeException("Attendance already recorded for this date");
        }

        Attendance attendance = new Attendance();
        attendance.setSecurityOfficer(officer);
        attendance.setAttendanceDate(dto.getAttendanceDate());
        attendance.setCheckInTime(dto.getCheckInTime());
        attendance.setCheckOutTime(dto.getCheckOutTime());
        attendance.setStatus(dto.getStatus());
        attendance.setRemarks(dto.getRemarks());
        attendance.setRecordedBy(manager);
        attendance.setIsShiftCounted(dto.getIsShiftCounted() != null ? dto.getIsShiftCounted() : true);

        // Calculate hours worked and overtime from times
        calculateHours(attendance);

        // Check monthly shift limit only if this record will count as a shift
        YearMonth yearMonth = YearMonth.from(dto.getAttendanceDate());
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();

        Integer currentShifts = attendanceRepository.countShiftsByOfficerInPeriod(
                officer.getId(), monthStart, monthEnd);

        if (currentShifts != null
                && currentShifts >= MAX_SHIFTS_PER_MONTH
                && Boolean.TRUE.equals(attendance.getIsShiftCounted())) {
            throw new RuntimeException("Officer has reached maximum shifts for the month (60 shifts)");
        }

        // If OT hours were provided explicitly, override calculated OT
        if (dto.getOvertimeHours() != null) {
            attendance.setOvertimeHours(dto.getOvertimeHours());
        }

        // Enforce monthly OT limit (180 hours) based on final OT value for this record
        Double newOt = attendance.getOvertimeHours() != null ? attendance.getOvertimeHours() : 0.0;
        if (newOt > 0.0) {
            Double existingOt = attendanceRepository.sumOvertimeHoursByOfficerInPeriod(
                    officer.getId(), monthStart, monthEnd);
            double totalOt = (existingOt != null ? existingOt : 0.0) + newOt;
            if (totalOt > MAX_OT_HOURS_PER_MONTH) {
                throw new RuntimeException("Officer has reached maximum OT hours for the month ("
                        + MAX_OT_HOURS_PER_MONTH + " hours)");
            }
        }

        Attendance saved = attendanceRepository.save(attendance);
        updateWeeklyReportForAttendance(saved, managerId);
        return convertToDTO(saved);
    }

    @Transactional
    public AttendanceDTO updateAttendance(Long id, AttendanceDTO dto) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));

        attendance.setCheckInTime(dto.getCheckInTime());
        attendance.setCheckOutTime(dto.getCheckOutTime());
        attendance.setStatus(dto.getStatus());
        attendance.setRemarks(dto.getRemarks());
        attendance.setIsShiftCounted(dto.getIsShiftCounted());

        // Keep old OT before recalculating for monthly limit check
        Double oldOt = attendance.getOvertimeHours() != null ? attendance.getOvertimeHours() : 0.0;

        // Recalculate hours and OT from times
        calculateHours(attendance);

        // If OT hours were provided explicitly, override calculated OT
        if (dto.getOvertimeHours() != null) {
            attendance.setOvertimeHours(dto.getOvertimeHours());
        }

        // Enforce monthly OT limit (180 hours) for updates
        Double newOt = attendance.getOvertimeHours() != null ? attendance.getOvertimeHours() : 0.0;
        if (!oldOt.equals(newOt)) {
            LocalDate date = attendance.getAttendanceDate();
            YearMonth yearMonth = YearMonth.from(date);
            LocalDate monthStart = yearMonth.atDay(1);
            LocalDate monthEnd = yearMonth.atEndOfMonth();

            Double existingOt = attendanceRepository.sumOvertimeHoursByOfficerInPeriod(
                    attendance.getSecurityOfficer().getId(), monthStart, monthEnd);
            double totalOt = (existingOt != null ? existingOt : 0.0) - oldOt + newOt;
            if (totalOt > MAX_OT_HOURS_PER_MONTH) {
                throw new RuntimeException("Officer has reached maximum OT hours for the month ("
                        + MAX_OT_HOURS_PER_MONTH + " hours)");
            }
        }

        Attendance updated = attendanceRepository.save(attendance);
        Long managerId = updated.getRecordedBy() != null
                ? updated.getRecordedBy().getId()
                : (updated.getSecurityOfficer().getAreaManager() != null
                ? updated.getSecurityOfficer().getAreaManager().getId()
                : null);
        if (managerId != null) {
            updateWeeklyReportForAttendance(updated, managerId);
        }
        return convertToDTO(updated);
    }

    /**
     * Refresh the weekly report for this officer and week: {@code totalShifts} stays tied to the
     * approved shift schedule; {@code totalHoursWorked} and {@code totalOvertimeHours} are summed
     * from {@code attendance} rows for scheduled days (see {@link WeeklyReportService#generateWeeklyReport}).
     */
    private void updateWeeklyReportForAttendance(Attendance attendance, Long managerId) {
        try {
            // Preserve existing weekly report rows (including their companyName) and only
            // update OT/hours totals based on attendance for that week.
            weeklyReportService.refreshWeeklyReportTotalsFromAttendance(
                    attendance.getSecurityOfficer().getId(),
                    managerId,
                    attendance.getAttendanceDate());
        } catch (Exception e) {
            // Helpful while debugging: attendance should not fail, but we need to see why weekly report refresh didn't run.
            System.err.println("Failed to refresh weekly reports after attendance update: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void calculateHours(Attendance attendance) {
        if (attendance.getCheckInTime() != null && attendance.getCheckOutTime() != null) {
            Duration duration = Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime());
            if (duration.isNegative()) {
                throw new RuntimeException("Check-out time cannot be earlier than check-in time.");
            }
            double hours = duration.toMinutes() / 60.0;
            attendance.setHoursWorked(hours);

            // Calculate overtime (hours over 8)
            if (hours > STANDARD_SHIFT_HOURS) {
                attendance.setOvertimeHours(hours - STANDARD_SHIFT_HOURS);
            } else {
                attendance.setOvertimeHours(0.0);
            }

            // Business rule: count shift only when worked >= 12 hours.
            attendance.setIsShiftCounted(hours >= STANDARD_SHIFT_HOURS);
        } else {
            attendance.setHoursWorked(0.0);
            attendance.setOvertimeHours(0.0);
            // No working hours -> never count as a shift
            attendance.setIsShiftCounted(false);
        }
    }

    public List<AttendanceDTO> getAttendanceByOfficer(Long officerId) {
        return attendanceRepository.findBySecurityOfficerId(officerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByDateRange(LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByAttendanceDateBetween(startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByManagerInPeriod(Long managerId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByAreaManagerInPeriod(managerId, startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns officers who have shift allocations on the given date
     * from APPROVED schedules, for the given area manager.
     */
    public List<SecurityOfficer> getApprovedOfficersByDate(Long managerId, LocalDate date) {
        if (managerId == null || date == null) return List.of();
        return shiftAssignmentRepository.findApprovedOfficersByAreaManagerAndDate(managerId, date);
    }

    /**
     * Officers allocated on {@code date} on an APPROVED shift schedule (used for attendance dropdown).
     */
    public List<SecurityOfficer> getApprovedOfficersByShiftDate(LocalDate date) {
        if (date == null) {
            return List.of();
        }
        return shiftAssignmentRepository.findApprovedOfficersByShiftDate(date);
    }

    public void deleteAttendance(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));
        Long officerId = attendance.getSecurityOfficer().getId();
        LocalDate attendanceDate = attendance.getAttendanceDate();
        Long managerId = attendance.getRecordedBy() != null
                ? attendance.getRecordedBy().getId()
                : (attendance.getSecurityOfficer().getAreaManager() != null
                ? attendance.getSecurityOfficer().getAreaManager().getId()
                : null);
        attendanceRepository.deleteById(id);
        if (managerId != null) {
            try {
                // Keep weekly report rows (including companyName) stable; only OT/hours totals
                // should reflect attendance rows for the week.
                weeklyReportService.refreshWeeklyReportTotalsFromAttendance(
                        officerId, managerId, attendanceDate);
            } catch (Exception ignored) { }
        }
    }

    private AttendanceDTO convertToDTO(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        dto.setSecurityOfficerId(attendance.getSecurityOfficer().getId());
        dto.setSecurityOfficerName(attendance.getSecurityOfficer().getFullName());
        dto.setSecurityId(attendance.getSecurityOfficer().getSecurityId());
        dto.setAttendanceDate(attendance.getAttendanceDate());
        dto.setCheckInTime(attendance.getCheckInTime());
        dto.setCheckOutTime(attendance.getCheckOutTime());
        dto.setStatus(attendance.getStatus());
        dto.setRemarks(attendance.getRemarks());
        dto.setHoursWorked(attendance.getHoursWorked());
        dto.setOvertimeHours(attendance.getOvertimeHours());
        dto.setIsShiftCounted(attendance.getIsShiftCounted());
        if (attendance.getRecordedBy() != null) {
            dto.setRecordedByName(attendance.getRecordedBy().getFullName());
        }
        return dto;
    }
}
