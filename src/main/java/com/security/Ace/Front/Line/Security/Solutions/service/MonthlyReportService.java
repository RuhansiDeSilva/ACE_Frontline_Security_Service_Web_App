package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.MonthlyReportDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.entity.MonthlyReport;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.MonthlyReportRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MonthlyReportService {

    @Autowired
    private MonthlyReportRepository monthlyReportRepository;

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @Lazy
    private WeeklyReportService weeklyReportService;

    @Transactional
    public MonthlyReportDTO createMonthlyReport(MonthlyReportDTO dto, Long managerId) {
        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        // Check if report already exists
        if (monthlyReportRepository.findByAreaManagerIdAndYearAndMonth(managerId, dto.getYear(), dto.getMonth()).isPresent()) {
            throw new RuntimeException("Monthly report already exists for this period");
        }

        MonthlyReport report = new MonthlyReport();
        report.setAreaManager(manager);
        report.setMonth(dto.getMonth());
        report.setYear(dto.getYear());
        report.setProblemsFaced(dto.getProblemsFaced());
        report.setRootCauses(dto.getRootCauses());
        report.setMitigationSteps(dto.getMitigationSteps());
        report.setComplaintsReceived(dto.getComplaintsReceived());
        report.setAdditionalNotes(dto.getAdditionalNotes());
        report.setGeneratedDate(LocalDate.now());
        report.setStatus(dto.getStatus() != null ? dto.getStatus() : "DRAFT");

        MonthlyReport saved = monthlyReportRepository.save(report);
        return convertToDTO(saved);
    }

    @Transactional
    public MonthlyReportDTO createMonthlyReportForAreaManagerEmail(MonthlyReportDTO dto, String areaManagerEmail) {
        AreaManager manager = resolveOrCreateAreaManagerByEmail(areaManagerEmail);
        return createMonthlyReport(dto, manager.getId());
    }

    @Transactional
    public MonthlyReportDTO updateMonthlyReport(Long id, MonthlyReportDTO dto) {
        MonthlyReport report = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly report not found"));

        report.setProblemsFaced(dto.getProblemsFaced());
        report.setRootCauses(dto.getRootCauses());
        report.setMitigationSteps(dto.getMitigationSteps());
        report.setComplaintsReceived(dto.getComplaintsReceived());
        report.setAdditionalNotes(dto.getAdditionalNotes());
        report.setStatus(dto.getStatus());

        MonthlyReport updated = monthlyReportRepository.save(report);
        return convertToDTO(updated);
    }

    public List<MonthlyReportDTO> getReportsByManager(Long managerId) {
        return monthlyReportRepository.findByManagerOrderByDate(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Read-only monthly report approval queue for chairman.
     * Only reports in SUBMITTED status are returned.
     */
    public List<MonthlyReportDTO> getAllReportsForChairmanView() {
        return monthlyReportRepository.findAllOrderByPeriodAndDateDesc().stream()
                .filter(r -> {
                    String s = r.getStatus() != null ? r.getStatus().trim() : "";
                    return "SUBMITTED".equalsIgnoreCase(s);
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MonthlyReportDTO submitReport(Long id, String areaManagerEmail) {
        MonthlyReport report = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly report not found"));

        AreaManager manager = resolveOrCreateAreaManagerByEmail(areaManagerEmail);
        if (report.getAreaManager() == null || !report.getAreaManager().getId().equals(manager.getId())) {
            throw new RuntimeException("You can only submit your own monthly report");
        }

        String current = report.getStatus() != null ? report.getStatus().trim().toUpperCase() : "DRAFT";
        if (!"DRAFT".equals(current) && !"REJECTED".equals(current)) {
            throw new RuntimeException("Only DRAFT or REJECTED reports can be submitted");
        }

        report.setStatus("SUBMITTED");
        return convertToDTO(monthlyReportRepository.save(report));
    }

    @Transactional
    public MonthlyReportDTO reviewSubmittedReport(Long id, String decisionStatus) {
        MonthlyReport report = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly report not found"));

        String next = decisionStatus == null ? "" : decisionStatus.trim().toUpperCase();
        if (!Set.of("APPROVED", "REJECTED").contains(next)) {
            throw new RuntimeException("Decision must be APPROVED or REJECTED");
        }

        String current = report.getStatus() != null ? report.getStatus().trim().toUpperCase() : "DRAFT";
        if (!"SUBMITTED".equals(current)) {
            throw new RuntimeException("Only SUBMITTED reports can be reviewed");
        }

        report.setStatus(next);
        return convertToDTO(monthlyReportRepository.save(report));
    }

    @Transactional
    public List<MonthlyReportDTO> getReportsByAreaManagerEmail(String areaManagerEmail) {
        AreaManager manager = resolveOrCreateAreaManagerByEmail(areaManagerEmail);
        return getReportsByManager(manager.getId());
    }

    public MonthlyReportDTO getReportById(Long id) {
        MonthlyReport report = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly report not found"));
        return convertToDTO(report);
    }

    public void deleteMonthlyReport(Long id) {
        monthlyReportRepository.deleteById(id);
    }

    private MonthlyReportDTO convertToDTO(MonthlyReport report) {
        MonthlyReportDTO dto = new MonthlyReportDTO();
        dto.setId(report.getId());
        dto.setMonth(report.getMonth());
        dto.setYear(report.getYear());
        dto.setMonthName(Month.of(report.getMonth()).name());
        dto.setProblemsFaced(report.getProblemsFaced());
        dto.setRootCauses(report.getRootCauses());
        dto.setMitigationSteps(report.getMitigationSteps());
        dto.setComplaintsReceived(report.getComplaintsReceived());
        dto.setAdditionalNotes(report.getAdditionalNotes());
        dto.setAreaManagerName(report.getAreaManager().getFullName());
        dto.setAreaManagerEmployeeId(report.getAreaManager().getEmployeeId());
        dto.setBranch(report.getAreaManager().getBranch() != null
                ? report.getAreaManager().getBranch().getBranchName()
                : null);
        dto.setGeneratedDate(report.getGeneratedDate());
        dto.setStatus(report.getStatus());
        return dto;
    }

    private AreaManager resolveOrCreateAreaManagerByEmail(String areaManagerEmail) {
        if (areaManagerEmail == null || areaManagerEmail.isBlank()) {
            throw new RuntimeException("Missing X-User-Email");
        }

        String email = areaManagerEmail.trim();
        Long managerId = weeklyReportService.resolveOrCreateAreaManagerIdByEmailOrFallback(email, null);
        if (managerId == null) {
            throw new RuntimeException("Area manager could not be resolved for email: " + email);
        }
        return areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Area manager not found after resolve for email: " + email));
    }
}
