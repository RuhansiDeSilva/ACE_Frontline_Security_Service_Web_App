package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollDetailDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.SalaryTrendsDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.AdvanceResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryAllowance;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryDeduction;
import com.security.Ace.Front.Line.Security.Solutions.entity.Notification;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.MonthlyStatisticsRepository;
import com.security.Ace.Front.Line.Security.Solutions.entity.MonthlyStatistics;
import com.security.Ace.Front.Line.Security.Solutions.service.SalaryService;
import com.security.Ace.Front.Line.Security.Solutions.repository.SecurityOfficerRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdvanceRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.PdfGenerator;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDate;
import lombok.Data;

@RestController
@RequestMapping("/api/payroll")
public class PayrollRestController {

    private final SalaryService salaryService;
    private final AdvanceRequestRepository advanceRequestRepository;
    private final UserRepository userRepository;
    private final PdfGenerator pdfGenerator;
    private final MonthlyStatisticsRepository monthlyStatisticsRepository;
    private final SecurityOfficerRepository securityOfficerRepository;

    public PayrollRestController(SalaryService salaryService,
                                 AdvanceRequestRepository advanceRequestRepository,
                                 UserRepository userRepository,
                                 PdfGenerator pdfGenerator,
                                 MonthlyStatisticsRepository monthlyStatisticsRepository,
                                 SecurityOfficerRepository securityOfficerRepository) {
        this.salaryService = salaryService;
        this.advanceRequestRepository = advanceRequestRepository;
        this.userRepository = userRepository;
        this.pdfGenerator = pdfGenerator;
        this.monthlyStatisticsRepository = monthlyStatisticsRepository;
        this.securityOfficerRepository = securityOfficerRepository;
    }

    /*
    @GetMapping("/stats")
    public ResponseEntity<com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(salaryService.getDashboardStats());
    }
   */
    @GetMapping("/trends")
    public ResponseEntity<SalaryTrendsDTO> getSalaryTrends(@RequestParam(required = false) Long officerId) {
        return ResponseEntity.ok(salaryService.getSalaryTrends(officerId));
    }

    @GetMapping("/officer/stats/{officerId}")
    public ResponseEntity<java.util.Map<String, Object>> getOfficerStats(@PathVariable Long officerId, @RequestParam String month) {
        try {
            String[] parts = month.split("-");
            if (parts.length != 2) return ResponseEntity.badRequest().body(java.util.Map.of());

            int yearInt = Integer.parseInt(parts[0]);
            int monthInt = Integer.parseInt(parts[1]);

            // Monthly statistics are keyed by security_officers.id, while payroll officerId
            // from the UI may come from users.id. Try direct match first, then resolve via user email.
            java.util.Optional<MonthlyStatistics> stats =
                    monthlyStatisticsRepository.findBySecurityOfficerIdAndYearAndMonth(officerId, yearInt, monthInt);

            if (stats.isEmpty()) {
                java.util.Optional<User> userOpt = userRepository.findById(officerId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();

                    // 1) Try matching by securityId <- username (common in this project: I3, SO001, etc.)
                    if (stats.isEmpty() && user.getUsername() != null && !user.getUsername().isBlank()) {
                        java.util.Optional<com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer> secOpt =
                                securityOfficerRepository.findBySecurityId(user.getUsername().trim());
                        if (secOpt.isPresent() && secOpt.get().getId() != null) {
                            stats = monthlyStatisticsRepository.findBySecurityOfficerIdAndYearAndMonth(
                                    secOpt.get().getId(), yearInt, monthInt);
                        }
                    }

                    // 2) Try matching by email
                    if (stats.isEmpty() && user.getEmail() != null && !user.getEmail().isBlank()) {
                        java.util.Optional<com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer> secOpt =
                                securityOfficerRepository.findByEmailAddress(user.getEmail().trim());
                        if (secOpt.isPresent() && secOpt.get().getId() != null) {
                            stats = monthlyStatisticsRepository.findBySecurityOfficerIdAndYearAndMonth(
                                    secOpt.get().getId(), yearInt, monthInt);
                        }
                    }

                    // 3) Fallback by full name (legacy data without email/securityId linkage)
                    if (stats.isEmpty() && user.getFullName() != null && !user.getFullName().isBlank()) {
                        java.util.Optional<com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer> secOpt =
                                securityOfficerRepository.findFirstByFullNameIgnoreCase(user.getFullName().trim());
                        if (secOpt.isPresent() && secOpt.get().getId() != null) {
                            stats = monthlyStatisticsRepository.findBySecurityOfficerIdAndYearAndMonth(
                                    secOpt.get().getId(), yearInt, monthInt);
                        }
                    }
                }
            }

            if (stats.isPresent()) {
                return ResponseEntity.ok(java.util.Map.of(
                        "monthlyShifts", stats.get().getMonthlyShifts(),
                        "monthlyOvertimeHours", stats.get().getMonthlyOvertimeHours()
                ));
            } else {
                return ResponseEntity.ok(java.util.Map.of("monthlyShifts", 0, "monthlyOvertimeHours", 0.0));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of());
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generatePayroll(@RequestBody PayrollRequestDTO request) {
        try {
            List<SalaryAllowance> allowances = new ArrayList<>();
            if (request.getAllowances() != null) {
                for (PayrollRequestDTO.AllowanceDTO a : request.getAllowances()) {
                    SalaryAllowance sa = new SalaryAllowance();
                    sa.setAllowanceName(a.getName());
                    sa.setAllowanceAmount(a.getAmount());
                    allowances.add(sa);
                }
            }

            List<SalaryDeduction> deductions = new ArrayList<>();
            if (request.getDeductions() != null) {
                for (PayrollRequestDTO.DeductionDTO d : request.getDeductions()) {
                    SalaryDeduction sd = new SalaryDeduction();
                    sd.setDeductionName(d.getName());
                    sd.setDeductionAmount(d.getAmount());
                    sd.setDeductionType(SalaryDeduction.DeductionType.CUSTOM);
                    deductions.add(sd);
                }
            }

            Salary saved = salaryService.generatePayroll(
                    request.getOfficerId(),
                    request.getMonth(),
                    request.getPayPeriodStart(),
                    request.getPayPeriodEnd(),
                    request.getTotalShifts(),
                    request.getBasicSalary(),
                    request.getOvertimeAmount(),
                    allowances,
                    deductions,
                    "SYSTEM_ADMIN" // Hardcoded for now, should come from auth
            );

            return ResponseEntity.ok(convertToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/list")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PayrollResponseDTO>> getPayrollList(@RequestParam String month) {
        System.out.println("Processing Payroll List request for month: " + month);
        List<Salary> salaries;
        if ("ALL".equalsIgnoreCase(month)) {
            salaries = salaryService.getCalculatedAcrossAllMonths();
        } else {
            salaries = salaryService.getCalculatedForMonth(month);
        }
        System.out.println("Found " + salaries.size() + " calculated records.");
        return ResponseEntity.ok(salaries.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/history")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PayrollResponseDTO>> getPayrollHistory(@RequestParam String month) {
        System.out.println("Processing Payroll History request for month: " + month);
        List<Salary> salaries;
        if ("ALL".equalsIgnoreCase(month)) {
            salaries = salaryService.getPaidAcrossAllMonths();
        } else {
            salaries = salaryService.getPaidForMonth(month);
        }
        System.out.println("Found " + salaries.size() + " paid records.");
        return ResponseEntity.ok(salaries.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/export")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportBankCSV() {

        String targetMonth = java.time.YearMonth.now().minusMonths(1).toString();
        List<Salary> salaries = salaryService.getPaidForMonth(targetMonth);

        StringBuilder csv = new StringBuilder();
        csv.append("Officer Name,Bank Name,Branch Name,Account Number,Net Salary\n");

        for (Salary s : salaries) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%.2f\n",
                    s.getOfficer().getFullName(),
                    s.getOfficer().getBankName() != null ? s.getOfficer().getBankName() : "N/A",
                    s.getOfficer().getBankBranch() != null ? s.getOfficer().getBankBranch() : "N/A",
                    s.getOfficer().getBankAccountNumber() != null ? s.getOfficer().getBankAccountNumber() : "N/A",
                    s.getNetSalary().doubleValue()));
        }

        byte[] output = csv.toString().getBytes();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "Bank_Export_" + targetMonth + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(output);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPayrollDetail(@PathVariable Long id) {
        try {
            Salary s = salaryService.getPayrollById(id);
            return ResponseEntity.ok(convertToDetailDTO(s));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayroll(@PathVariable Long id, @RequestBody PayrollRequestDTO request) {
        try {
            List<SalaryAllowance> allowances = new ArrayList<>();
            if (request.getAllowances() != null) {
                for (PayrollRequestDTO.AllowanceDTO a : request.getAllowances()) {
                    SalaryAllowance sa = new SalaryAllowance();
                    sa.setAllowanceName(a.getName());
                    sa.setAllowanceAmount(a.getAmount());
                    allowances.add(sa);
                }
            }

            List<SalaryDeduction> deductions = new ArrayList<>();
            if (request.getDeductions() != null) {
                for (PayrollRequestDTO.DeductionDTO d : request.getDeductions()) {
                    SalaryDeduction sd = new SalaryDeduction();
                    sd.setDeductionName(d.getName());
                    sd.setDeductionAmount(d.getAmount());
                    sd.setDeductionType(SalaryDeduction.DeductionType.CUSTOM);
                    deductions.add(sd);
                }
            }

            Salary updated = salaryService.updatePayroll(
                    id,
                    request.getTotalShifts(),
                    request.getOvertimeAmount(),
                    allowances,
                    deductions,
                    "SYSTEM_ADMIN");
            return ResponseEntity.ok(convertToDetailDTO(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pay/{id}")
    public ResponseEntity<?> markAsPaid(@PathVariable Long id) {
        try {
            Salary salary = salaryService.getPayrollById(id);
            java.time.LocalDate deadline = java.time.YearMonth.parse(salary.getMonth()).plusMonths(1).atDay(8);
            if (java.time.LocalDate.now().isAfter(deadline)) {
                return ResponseEntity.badRequest().body("Salaries for " + salary.getMonth() + " cannot be paid after " + deadline + ".");
            }
            salaryService.markAsPaid(id, LocalDate.now(), "Bank Transfer", "REF-" + System.currentTimeMillis(),
                    "Admin");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePayroll(@PathVariable Long id) {
        try {
            salaryService.deletePayroll(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/payslip/pdf/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadPayslip(@PathVariable Long id) {
        try {
            Salary salary = salaryService.getPayrollById(id);
            byte[] pdfBytes = pdfGenerator.generatePayslip(salary);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payslip_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error generating payslip PDF: " + e.getMessage(), e);
        }
    }

    @GetMapping("/trends/pdf")
    public void downloadSalaryTrends(@RequestParam(required = false) Long officerId, HttpServletResponse response)
            throws IOException {
        SalaryTrendsDTO trends = salaryService.getSalaryTrends(officerId);
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=salary_trends_report.pdf");
        pdfGenerator.generateSalaryTrendsReport(trends, response.getOutputStream());
    }

    @GetMapping("/officer/payslips/{officerId}")
    public ResponseEntity<List<PayrollResponseDTO>> getOfficerPayslips(@PathVariable Long officerId) {
        List<Salary> payslips = salaryService.getPaidPayslipsForOfficer(officerId);
        return ResponseEntity.ok(payslips.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    // --- ADVANCE REQUESTS ---

    @GetMapping("/advances")
    public ResponseEntity<?> getAdvances(@RequestParam(required = false) String status) {
        List<AdvanceRequest> advances;
        if (status != null) {
            try {
                advances = advanceRequestRepository.findByStatus(RequestStatus.valueOf(status.toUpperCase()));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Invalid status: " + status);
            }
        } else {
            advances = advanceRequestRepository.findAll();
        }

        return ResponseEntity.ok(advances.stream().map(this::convertAdvanceToDTO).toList());
    }

    @GetMapping("/advances/debug")
    public ResponseEntity<List<AdvanceRequest>> debugAdvances() {
        return ResponseEntity.ok(advanceRequestRepository.findAll());
    }

    private AdvanceResponseDTO convertAdvanceToDTO(AdvanceRequest ar) {
        AdvanceResponseDTO dto = new AdvanceResponseDTO();
        dto.setId(ar.getId());

        AdvanceResponseDTO.OfficerDTO officer = new AdvanceResponseDTO.OfficerDTO();
        if (ar.getUser() != null) {
            officer.setFullName(ar.getUser().getFullName() != null ? ar.getUser().getFullName() : ar.getUser().getEmail());
            officer.setOfficerId(String.valueOf(ar.getUser().getId()));
        } else {
            officer.setFullName("-");
            officer.setOfficerId("-");
        }
        dto.setOfficer(officer);

        dto.setRequestedDate(ar.getCreatedAt() != null ? ar.getCreatedAt().toLocalDate().toString() : null);
        dto.setReason(ar.getReason());
        dto.setRequestedAmount(ar.getAmount());
        dto.setStatus(ar.getStatus() != null ? ar.getStatus().name() : null);
        dto.setAdvanceMonth(ar.getForMonth());
        dto.setPaymentDate(ar.getReviewedAt() != null ? ar.getReviewedAt().toLocalDate().toString() : null);
        dto.setDeducted(ar.isDeducted());
        return dto;
    }

    @PostMapping("/advances/approve/{id}")
    public ResponseEntity<?> approveAdvance(@PathVariable Long id, @RequestParam Long reviewerId) {
        try {
            User reviewer = userRepository.findById(reviewerId)
                    .orElseThrow(() -> new IllegalArgumentException("Reviewer not found: " + reviewerId));
            salaryService.handleAreaManagerReview(id, reviewer, true, null);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/advances/reject/{id}")
    public ResponseEntity<?> rejectAdvance(@PathVariable Long id, @RequestParam Long reviewerId, @RequestParam String reason) {
        try {
            User reviewer = userRepository.findById(reviewerId)
                    .orElseThrow(() -> new IllegalArgumentException("Reviewer not found: " + reviewerId));
            salaryService.handleAreaManagerReview(id, reviewer, false, reason);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/advances/pay/{id}")
    public ResponseEntity<?> markAdvanceAsPaid(@PathVariable Long id, @RequestParam Long accountantId) {
        if (java.time.LocalDate.now().getDayOfMonth() > 23) {
            return ResponseEntity.badRequest().body("Advances cannot be processed after the 23rd of the month.");
        }
        try {
            User accountant = userRepository.findById(accountantId)
                    .orElseThrow(() -> new IllegalArgumentException("Accountant not found: " + accountantId));
            salaryService.handleAccountantPayment(id, accountant);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/advances/export")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportAdvancesCSV(@RequestParam String month) {
        if ("ALL".equalsIgnoreCase(month)) {
            return ResponseEntity.badRequest().body("Please select a specific month to export.".getBytes());
        }

        List<AdvanceRequest> advances = advanceRequestRepository.findAll().stream()
                .filter(a -> month.equals(a.getForMonth()) && (a.getStatus() == RequestStatus.PAID || a.getStatus() == RequestStatus.PROCESSING))
                .collect(Collectors.toList());

        StringBuilder csv = new StringBuilder();
        csv.append("Officer Name,Bank Name,Branch Name,Account Number,Advance Amount,For Month,Status\n");

        for (AdvanceRequest a : advances) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\",\"%s\"\n",
                    a.getUser().getFullName(),
                    a.getUser().getBankName() != null ? a.getUser().getBankName() : "N/A",
                    a.getUser().getBankBranch() != null ? a.getUser().getBankBranch() : "N/A",
                    a.getUser().getBankAccountNumber() != null ? a.getUser().getBankAccountNumber() : "N/A",
                    a.getAmount(),
                    a.getForMonth(),
                    a.getStatus().name()));
        }

        byte[] output = csv.toString().getBytes();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "Advances_Export_" + month + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(output);
    }

    @GetMapping("/notifications/{userId}")
    public ResponseEntity<List<Notification>> getNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(salaryService.getNotifications(userId));
    }

    @PostMapping("/notifications/read/{id}")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable Long id) {
        salaryService.markNotificationAsRead(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/officer/advances/{officerId}")
    public ResponseEntity<List<AdvanceResponseDTO>> getOfficerAdvances(@PathVariable Long officerId,
                                                                       @RequestParam String month) {
        List<AdvanceRequest> advances = salaryService.getUndeductedPaidAdvances(officerId, month);
        return ResponseEntity.ok(advances.stream().map(this::convertAdvanceToDTO).collect(Collectors.toList()));
    }

    @PostMapping("/advances/create")
    public ResponseEntity<?> createAdvance(@RequestBody AdvanceRequestDTO request) {
        try {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getUserId()));
            AdvanceRequest created = salaryService.createAdvanceRequest(
                    user,
                    request.getAmount(),
                    request.getReason(),
                    request.getForMonth()
            );
            return ResponseEntity.ok(convertAdvanceToDTO(created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DTO for creating advance
    @Data
    public static class AdvanceRequestDTO {
        private Long userId;
        private Double amount;
        private String reason;
        private String forMonth;
    }

    private PayrollDetailDTO convertToDetailDTO(Salary s) {
        PayrollDetailDTO dto = new PayrollDetailDTO();
        dto.setId(s.getId());
        dto.setMonth(s.getMonth());
        dto.setOfficerName(s.getOfficer().getFullName());
        dto.setOfficerId(String.valueOf(s.getOfficer().getId()));
        dto.setBasicSalary(s.getBasicSalary());
        dto.setOtRate(java.math.BigDecimal.valueOf(500.00));
        dto.setTotalShifts(s.getTotalShifts());
        dto.setBankName(s.getOfficer().getBankName());
        dto.setBranchName(s.getOfficer().getBankBranch());
        dto.setAccountNumber(s.getOfficer().getBankAccountNumber());

        dto.setAllowances(s.getSalaryAllowances().stream().map(a -> {
            PayrollDetailDTO.AllowanceDTO adto = new PayrollDetailDTO.AllowanceDTO();
            adto.setName(a.getAllowanceName());
            adto.setAmount(a.getAllowanceAmount());
            return adto;
        }).collect(Collectors.toList()));

        dto.setDeductions(s.getSalaryDeductions().stream().map(d -> {
            PayrollDetailDTO.DeductionDTO ddto = new PayrollDetailDTO.DeductionDTO();
            ddto.setName(d.getDeductionName());
            ddto.setAmount(d.getDeductionAmount());
            return ddto;
        }).collect(Collectors.toList()));

        dto.setNetSalary(s.getNetSalary());
        String inWords = com.security.Ace.Front.Line.Security.Solutions.util.NumberToWords
                .convert(s.getNetSalary().longValue()) + " Rupees Only";
        dto.setNetSalaryInWords(inWords);

        return dto;
    }

    private PayrollResponseDTO convertToDTO(Salary s) {
        PayrollResponseDTO dto = new PayrollResponseDTO();
        dto.setId(s.getId());
        dto.setMonth(s.getMonth());
        dto.setBasicSalary(s.getBasicSalary());
        dto.setTotalAllowances(s.getTotalAllowances());
        dto.setTotalDeductions(s.getTotalDeductions());
        dto.setNetSalary(s.getNetSalary());
        dto.setPaymentDate(s.getPaymentDate());
        dto.setStatus(s.getStatus().name());

        PayrollResponseDTO.OfficerInfo officerInfo = new PayrollResponseDTO.OfficerInfo();
        officerInfo.setOfficerId(String.valueOf(s.getOfficer().getId()));
        officerInfo.setFullName(s.getOfficer().getFullName());
        dto.setOfficer(officerInfo);

        return dto;
    }
}

