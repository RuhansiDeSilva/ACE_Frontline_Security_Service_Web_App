package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.entity.Paysheet;
import com.security.Ace.Front.Line.Security.Solutions.entity.PayrollStatistics;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.PayrollStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.PayrollStatisticsRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.PaysheetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PayrollStatisticsService {

    private final PayrollStatisticsRepository payrollStatisticsRepository;
    private final PaysheetRepository paysheetRepository;

    @Transactional
    public PayrollStatistics generateMonthlyStatistics(String payMonth) {
        // Get all approved payrolls for the month
        List<Paysheet> payrolls = paysheetRepository.findByStatusAndPayMonth(PayrollStatus.SENT_TO_BANK, payMonth);

        if (payrolls.isEmpty()) {
            throw new ResourceNotFoundException("No completed payrolls found for month: " + payMonth);
        }

        // Group by role and calculate statistics
        for (String role : extractUniqRoles(payrolls)) {
            List<Paysheet> rolePayrolls = payrolls.stream()
                    .filter(p -> p.getUser().getRole().toString().equals(role))
                    .toList();

            if (!rolePayrolls.isEmpty()) {
                double totalAmount = rolePayrolls.stream().mapToDouble(Paysheet::getNetSalary).sum();
                double averageSalary = totalAmount / rolePayrolls.size();
                double maxSalary = rolePayrolls.stream().mapToDouble(Paysheet::getNetSalary).max().orElse(0);
                double minSalary = rolePayrolls.stream().mapToDouble(Paysheet::getNetSalary).min().orElse(0);

                PayrollStatistics stats = PayrollStatistics.builder()
                        .payMonth(payMonth)
                        .role(role)
                        .totalProcessed(rolePayrolls.size())
                        .totalAmount(totalAmount)
                        .averageSalary(averageSalary)
                        .maxSalary(maxSalary)
                        .minSalary(minSalary)
                        .totalApproved((int) rolePayrolls.stream()
                                .filter(p -> p.getStatus() == PayrollStatus.APPROVED_BY_DIRECTOR)
                                .count())
                        .totalRejected((int) paysheetRepository.findByStatusAndPayMonth(PayrollStatus.REJECTED_BY_DIRECTOR, payMonth).size())
                        .totalSentToBank((int) rolePayrolls.size())
                        .build();

                payrollStatisticsRepository.save(stats);
            }
        }

        // Return overall statistics
        double totalAmount = payrolls.stream().mapToDouble(Paysheet::getNetSalary).sum();
        return PayrollStatistics.builder()
                .payMonth(payMonth)
                .role("ALL")
                .totalProcessed(payrolls.size())
                .totalAmount(totalAmount)
                .averageSalary(totalAmount / payrolls.size())
                .maxSalary(payrolls.stream().mapToDouble(Paysheet::getNetSalary).max().orElse(0))
                .minSalary(payrolls.stream().mapToDouble(Paysheet::getNetSalary).min().orElse(0))
                .totalSentToBank(payrolls.size())
                .build();
    }

    public PayrollStatistics getMonthlyStatistics(String payMonth, String role) {
        return payrollStatisticsRepository.findByPayMonthAndRole(payMonth, role)
                .orElseThrow(() -> new ResourceNotFoundException("Statistics not found for month: " + payMonth + " and role: " + role));
    }

    public List<PayrollStatistics> getMonthlyStatisticsForMonth(String payMonth) {
        return payrollStatisticsRepository.findByPayMonthOrderByRoleAsc(payMonth);
    }

    public List<PayrollStatistics> getStatisticsForRole(String role) {
        return payrollStatisticsRepository.findByRoleOrderByPayMonthDesc(role);
    }

    public List<PayrollStatistics> getLast12MonthsStatistics() {
        return payrollStatisticsRepository.findLast12Months();
    }

    public List<PayrollStatistics> getStatisticsRange(String startMonth, String endMonth) {
        return payrollStatisticsRepository.findByMonthRange(startMonth, endMonth);
    }

    // ==================== Admin Personnel Statistics ====================

    public List<PayrollStatistics> getAdminPersonnelStatistics(String payMonth) {
        List<Paysheet> adminPayrolls = paysheetRepository.findAdminPayrollsForMonth(payMonth);
        
        if (adminPayrolls.isEmpty()) {
            return List.of();
        }

        double totalAmount = adminPayrolls.stream().mapToDouble(Paysheet::getNetSalary).sum();
        double averageSalary = totalAmount / adminPayrolls.size();
        int approved = (int) adminPayrolls.stream()
                .filter(p -> p.getStatus() == PayrollStatus.APPROVED_BY_DIRECTOR)
                .count();

        PayrollStatistics stats = PayrollStatistics.builder()
                .payMonth(payMonth)
                .role("ADMIN_PERSONNEL")
                .totalProcessed(adminPayrolls.size())
                .totalAmount(totalAmount)
                .averageSalary(averageSalary)
                .maxSalary(adminPayrolls.stream().mapToDouble(Paysheet::getNetSalary).max().orElse(0))
                .minSalary(adminPayrolls.stream().mapToDouble(Paysheet::getNetSalary).min().orElse(0))
                .totalApproved(approved)
                .build();

        return List.of(stats);
    }

    public List<PayrollStatistics> getSecurityForceStatistics(String payMonth) {
        List<Paysheet> securityPayrolls = paysheetRepository.findSecurityPayrollsForMonth(payMonth);
        
        if (securityPayrolls.isEmpty()) {
            return List.of();
        }

        double totalAmount = securityPayrolls.stream().mapToDouble(Paysheet::getNetSalary).sum();
        double averageSalary = totalAmount / securityPayrolls.size();
        int approved = (int) securityPayrolls.stream()
                .filter(p -> p.getStatus() == PayrollStatus.APPROVED_BY_DIRECTOR)
                .count();

        PayrollStatistics stats = PayrollStatistics.builder()
                .payMonth(payMonth)
                .role("SECURITY_FORCE")
                .totalProcessed(securityPayrolls.size())
                .totalAmount(totalAmount)
                .averageSalary(averageSalary)
                .maxSalary(securityPayrolls.stream().mapToDouble(Paysheet::getNetSalary).max().orElse(0))
                .minSalary(securityPayrolls.stream().mapToDouble(Paysheet::getNetSalary).min().orElse(0))
                .totalApproved(approved)
                .build();

        return List.of(stats);
    }

    public PayrollStatistics getAdminPersonnelSummary(String payMonth) {
        return getAdminPersonnelStatistics(payMonth).stream().findFirst().orElseThrow(() -> 
            new ResourceNotFoundException("Admin personnel statistics not found for month: " + payMonth));
    }

    public PayrollStatistics getSecurityForceSummary(String payMonth) {
        return getSecurityForceStatistics(payMonth).stream().findFirst().orElseThrow(() -> 
            new ResourceNotFoundException("Security force statistics not found for month: " + payMonth));
    }

    private List<String> extractUniqRoles(List<Paysheet> payrolls) {
        return payrolls.stream()
                .map(p -> p.getUser().getRole().toString())
                .distinct()
                .toList();
    }
}
