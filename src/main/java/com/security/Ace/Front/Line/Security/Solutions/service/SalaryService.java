package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.SalaryTrendsDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core payroll service: generates salary (payroll) records,
 * stores allowances/deductions and handles mark-as-paid.
 */
@Service
public class SalaryService {

    private final UserRepository officerRepository;
    private final SalaryRepository salaryRepository;
    private final SalaryAllowanceRepository allowanceRepository;
    private final SalaryDeductionRepository deductionRepository;
    private final AdvanceRequestRepository advanceRequestRepository;
    private final NotificationRepository notificationRepository;

    public SalaryService(UserRepository officerRepository,
                         SalaryRepository salaryRepository,
                         SalaryAllowanceRepository allowanceRepository,
                         SalaryDeductionRepository deductionRepository,
                         AdvanceRequestRepository advanceRequestRepository,
                         NotificationRepository notificationRepository) {
        this.officerRepository = officerRepository;
        this.salaryRepository = salaryRepository;
        this.allowanceRepository = allowanceRepository;
        this.deductionRepository = deductionRepository;
        this.advanceRequestRepository = advanceRequestRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public SalaryTrendsDTO getSalaryTrends(Long officerId) {
        List<Salary> salaries;
        if (officerId != null && officerId > 0) {
            salaries = salaryRepository.findByOfficer_IdAndStatusPaidOnly(officerId);
        } else {
            salaries = salaryRepository.findByStatusPaidOnly();
        }

        SalaryTrendsDTO dto = new SalaryTrendsDTO();

        List<Salary> validSalaries = salaries.stream()
                .filter(s -> s.getMonth() != null)
                .filter(s -> s.getStatus() != null && s.getStatus() == Salary.Status.PAID)
                .collect(Collectors.toList());

        if (validSalaries.isEmpty()) {
            dto.setMonthlyTrends(Collections.emptyList());
            dto.setDistribution(Collections.emptyList());
            dto.setAverageSalary(BigDecimal.ZERO);
            dto.setHighestSalary(BigDecimal.ZERO);
            dto.setLowestSalary(BigDecimal.ZERO);
            dto.setTotalYTD(BigDecimal.ZERO);
            dto.setGrowthRate(0.0);
            dto.setAllowanceBreakdown(Collections.emptyList());
            dto.setDeductionBreakdown(Collections.emptyList());
            return dto;
        }

        Map<String, List<Salary>> groupedByMonth = validSalaries.stream()
                .collect(Collectors.groupingBy(Salary::getMonth, TreeMap::new, Collectors.toList()));

        List<SalaryTrendsDTO.MonthTrend> trends = groupedByMonth.entrySet().stream()
                .map(e -> {
                    List<Salary> paidInMonth = e.getValue();

                    BigDecimal totalNet = paidInMonth.stream()
                            .map(s -> s.getNetSalary() != null ? s.getNetSalary() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal avgNet = paidInMonth.isEmpty() ? BigDecimal.ZERO : totalNet.divide(BigDecimal.valueOf(paidInMonth.size()), 2, RoundingMode.HALF_UP);

                    BigDecimal totalAllowances = paidInMonth.stream()
                            .map(s -> s.getTotalAllowances() != null ? s.getTotalAllowances() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalDeductions = paidInMonth.stream()
                            .map(s -> s.getTotalDeductions() != null ? s.getTotalDeductions() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalOvertime = paidInMonth.stream()
                            .flatMap(s -> s.getSalaryAllowances().stream())
                            .filter(sa -> {
                                String name = sa.getAllowanceName();
                                return name != null && (name.toLowerCase().contains("overtime") || name.equalsIgnoreCase("ot"));
                            })
                            .map(sa -> sa.getAllowanceAmount() != null ? sa.getAllowanceAmount() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return new SalaryTrendsDTO.MonthTrend(e.getKey(), avgNet, totalAllowances, totalDeductions, totalOvertime);
                })
                .collect(Collectors.toList());
        dto.setMonthlyTrends(trends);

        BigDecimal totalNetAll = validSalaries.stream()
                .map(s -> s.getNetSalary() != null ? s.getNetSalary() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setAverageSalary(totalNetAll.divide(BigDecimal.valueOf(validSalaries.size()), 2, RoundingMode.HALF_UP));

        validSalaries.stream()
                .filter(s -> s.getNetSalary() != null)
                .max(Comparator.comparing(Salary::getNetSalary))
                .ifPresent(s -> {
                    dto.setHighestSalary(s.getNetSalary());
                    dto.setHighestSalaryMonth(s.getMonth());
                });

        validSalaries.stream()
                .filter(s -> s.getNetSalary() != null)
                .min(Comparator.comparing(Salary::getNetSalary))
                .ifPresent(s -> {
                    dto.setLowestSalary(s.getNetSalary());
                    dto.setLowestSalaryMonth(s.getMonth());
                });

        String currentYear = String.valueOf(LocalDate.now().getYear());
        BigDecimal ytd = validSalaries.stream()
                .filter(s -> s.getMonth().startsWith(currentYear))
                .map(s -> s.getNetSalary() != null ? s.getNetSalary() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalYTD(ytd);

        BigDecimal totalOvertimeAll = validSalaries.stream()
                .flatMap(s -> s.getSalaryAllowances().stream())
                .filter(sa -> {
                    String name = sa.getAllowanceName();
                    return name != null && (name.toLowerCase().contains("overtime") || name.equalsIgnoreCase("ot"));
                })
                .map(sa -> sa.getAllowanceAmount() != null ? sa.getAllowanceAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalOvertime(totalOvertimeAll);

        if (trends.size() >= 2) {
            BigDecimal first = trends.get(0).getAmount();
            BigDecimal last = trends.get(trends.size() - 1).getAmount();
            if (first != null && first.compareTo(BigDecimal.ZERO) > 0) {
                double rate = (last.subtract(first)).doubleValue() / first.doubleValue() * 100;
                dto.setGrowthRate(Math.round(rate * 10) / 10.0);
            }
        }

        Map<String, Long> distMap = new LinkedHashMap<>();
        distMap.put("0-30k", 0L); distMap.put("30-40k", 0L); distMap.put("40-50k", 0L);
        distMap.put("50-60k", 0L); distMap.put("60-70k", 0L); distMap.put("70k+", 0L);

        for (Salary s : validSalaries) {
            double net = (s.getNetSalary() != null ? s.getNetSalary() : BigDecimal.ZERO).doubleValue();
            if (net < 30000) distMap.put("0-30k", distMap.get("0-30k") + 1);
            else if (net < 40000) distMap.put("30-40k", distMap.get("30-40k") + 1);
            else if (net < 50000) distMap.put("40-50k", distMap.get("40-50k") + 1);
            else if (net < 60000) distMap.put("50-60k", distMap.get("50-60k") + 1);
            else if (net < 70000) distMap.put("60-70k", distMap.get("60-70k") + 1);
            else distMap.put("70k+", distMap.get("70k+") + 1);
        }

        dto.setDistribution(distMap.entrySet().stream()
                .map(e -> new SalaryTrendsDTO.SalaryDistribution(e.getKey(), e.getValue()))
                .collect(Collectors.toList()));

        Map<String, BigDecimal> allowancesMap = new HashMap<>();
        Map<String, BigDecimal> deductionsMap = new HashMap<>();

        for (Salary s : validSalaries) {
            allowancesMap.merge("Basic Salary", s.getBasicSalary() != null ? s.getBasicSalary() : BigDecimal.ZERO, BigDecimal::add);
            if (s.getSalaryAllowances() != null) {
                for (SalaryAllowance sa : s.getSalaryAllowances()) {
                    allowancesMap.merge(sa.getAllowanceName() != null ? sa.getAllowanceName() : "Other", sa.getAllowanceAmount() != null ? sa.getAllowanceAmount() : BigDecimal.ZERO, BigDecimal::add);
                }
            }
            if (s.getSalaryDeductions() != null) {
                for (SalaryDeduction sd : s.getSalaryDeductions()) {
                    deductionsMap.merge(sd.getDeductionName() != null ? sd.getDeductionName() : "Other", sd.getDeductionAmount() != null ? sd.getDeductionAmount() : BigDecimal.ZERO, BigDecimal::add);
                }
            }
        }

        dto.setAllowanceBreakdown(allowancesMap.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> new SalaryTrendsDTO.BreakdownItem(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(SalaryTrendsDTO.BreakdownItem::getAmount).reversed())
                .collect(Collectors.toList()));

        dto.setDeductionBreakdown(deductionsMap.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> new SalaryTrendsDTO.BreakdownItem(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(SalaryTrendsDTO.BreakdownItem::getAmount).reversed())
                .collect(Collectors.toList()));

        return dto;
    }

    @Transactional
    public Salary generatePayroll(Long officerId, String month, LocalDate periodStart, LocalDate periodEnd,
                                  int totalShifts, BigDecimal basicSalary, BigDecimal overtimeAmount,
                                  List<SalaryAllowance> allowances, List<SalaryDeduction> deductions,
                                  String calculatedBy) {

        User officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found: " + officerId));

        Optional<Salary> existing = salaryRepository.findByOfficerAndMonth(officer, month);
        if (existing.isPresent()) {
            throw new IllegalStateException("Payroll already exists for this officer/month");
        }

        // Detect paid undeducted advances
        List<AdvanceRequest> advances = advanceRequestRepository.findByUserAndForMonthAndStatusAndDeducted(
                officer, month, RequestStatus.PAID, false);

        boolean hasAdvanceDeduction = deductions.stream()
                .anyMatch(d -> d.getDeductionName() != null && d.getDeductionName().contains("Salary Advance"));

        if (!hasAdvanceDeduction && !advances.isEmpty()) {
            BigDecimal totalAdvance = advances.stream()
                    .map(adv -> BigDecimal.valueOf(adv.getAmount()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            SalaryDeduction d = new SalaryDeduction();
            d.setDeductionName("Salary Advance");
            d.setDeductionAmount(totalAdvance);
            d.setDeductionType(SalaryDeduction.DeductionType.CUSTOM);
            deductions.add(d);
        }

        // Calculate EPF (8% of Basic)
        BigDecimal epfAmount = BigDecimal.valueOf(officer.getBasicSalary() != null ? officer.getBasicSalary() : 0.0).multiply(new BigDecimal("0.08"));
        if (deductions.stream().noneMatch(d -> d.getDeductionName().contains("EPF"))) {
            SalaryDeduction epf = new SalaryDeduction();
            epf.setDeductionName("EPF (8%)");
            epf.setDeductionAmount(epfAmount);
            epf.setDeductionType(SalaryDeduction.DeductionType.STATUTORY);
            deductions.add(epf);
        }

        BigDecimal totalAllowances = allowances.stream().map(SalaryAllowance::getAllowanceAmount).reduce(BigDecimal.ZERO, BigDecimal::add).add(basicSalary != null ? basicSalary : BigDecimal.ZERO);
        BigDecimal totalDeductions = deductions.stream().map(SalaryDeduction::getDeductionAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Salary salary = new Salary();
        salary.setOfficer(officer);
        salary.setMonth(month);
        salary.setPayPeriodStart(periodStart);
        salary.setPayPeriodEnd(periodEnd);
        if (periodEnd != null) salary.setPaymentDate(periodEnd.plusDays(10));
        salary.setStatus(Salary.Status.CALCULATED);
        salary.setTotalShifts(totalShifts);
        salary.setBasicSalary(basicSalary);
        salary.setTotalAllowances(totalAllowances);
        salary.setTotalDeductions(totalDeductions);
        salary.setNetSalary(totalAllowances.subtract(totalDeductions));
        salary.setCalculatedBy(calculatedBy);

        Salary saved = salaryRepository.save(salary);

        for (SalaryAllowance a : allowances) { a.setPayroll(saved); allowanceRepository.save(a); }
        for (SalaryDeduction d : deductions) { d.setPayroll(saved); deductionRepository.save(d); }

        for (AdvanceRequest adv : advances) { adv.setDeducted(true); advanceRequestRepository.save(adv); }

        return saved;
    }

    @Transactional
    public void handleAreaManagerReview(Long id, User areaManager, boolean approved, String rejectionReason) {

        AdvanceRequest adv = advanceRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Advance not found"));

        if (adv.getStatus() == RequestStatus.PAID) {
            // Do not overwrite status if already paid
            return;
        }

        adv.setAreaReviewedBy(areaManager);
        adv.setAreaReviewedAt(LocalDateTime.now());
        if (approved) {
            adv.setStatus(RequestStatus.APPROVED);
        } else {
            adv.setStatus(RequestStatus.REJECTED);
            adv.setRejectionReason(rejectionReason);
        }
        advanceRequestRepository.save(adv);
    }

    @Transactional
    public void handleAccountantPayment(Long id, User accountant) {
        AdvanceRequest adv = advanceRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Advance not found"));
        adv.setReviewedBy(accountant);
        adv.setReviewedAt(LocalDateTime.now());
        adv.setStatus(RequestStatus.PROCESSING);
        advanceRequestRepository.save(adv);
    }

    @Transactional
    public AdvanceRequest createAdvanceRequest(User user, Double amount, String reason, String forMonth) {
        AdvanceRequest adv = AdvanceRequest.builder()
                .user(user)
                .amount(amount)
                .reason(reason)
                .forMonth(forMonth)
                .status(RequestStatus.PENDING)
                .build();
        return advanceRequestRepository.save(adv);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(Long userId) {
        User user = officerRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    @Transactional
    public Salary markAsPaid(Long payrollId, LocalDate paymentDate, String paymentMethod, String paymentReference, String adminUsername) {
        Salary salary = salaryRepository.findById(payrollId).orElseThrow(() -> new IllegalArgumentException("Payroll not found"));
        salary.setStatus(Salary.Status.PAID);
        salary.setPaymentDate(paymentDate);
        salary.setPaymentMethod(paymentMethod);
        salary.setPaymentReference(paymentReference);
        salary.setMarkedPaidBy(adminUsername);
        salary.setPaidAt(OffsetDateTime.now());
        return salaryRepository.save(salary);
    }

    @Transactional
    public Salary markSalaryAsPaid(Long salaryId) {
        return markAsPaid(salaryId, LocalDate.now(), "System payment", "AUTO-PAYMENT", "system");
    }

    public List<Salary> getCalculatedForMonth(String month) { return salaryRepository.findByStatusAndMonth(Salary.Status.CALCULATED, month); }
    public List<Salary> getCalculatedAcrossAllMonths() { return salaryRepository.findByStatus(Salary.Status.CALCULATED); }
    public List<Salary> getPaidForMonth(String month) { return salaryRepository.findByStatusAndMonth(Salary.Status.PAID, month); }
    public List<Salary> getPaidAcrossAllMonths() { return salaryRepository.findByStatus(Salary.Status.PAID); }
    public Salary getPayrollById(Long id) { return salaryRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Not found")); }
    public void deletePayroll(Long id) { salaryRepository.deleteById(id); }
    public List<Salary> getPaidPayslipsForOfficer(Long officerId) { 
        return salaryRepository.findByOfficer_Id(officerId); 
    }

    /*
    public com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsDTO getDashboardStats() {
        LocalDate now = LocalDate.now();
        com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsDTO stats = new com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsDTO();
        stats.setTotalOfficers((int) officerRepository.countByRole(com.security.Ace.Front.Line.Security.Solutions.enums.Role.SECURITY_OFFICER));
        stats.setPendingPayrolls(salaryRepository.findByStatus(Salary.Status.CALCULATED).size());
        List<Salary> paidThisMonth = salaryRepository.findByStatusAndPaymentDateBetween(Salary.Status.PAID, now.withDayOfMonth(1), now.withDayOfMonth(now.lengthOfMonth()));
        stats.setPaidThisMonth(paidThisMonth.size());
        stats.setTotalPayout(paidThisMonth.stream().map(Salary::getNetSalary).reduce(BigDecimal.ZERO, BigDecimal::add));
        return stats;
    }

     */

    @Transactional
    public Salary updatePayroll(Long payrollId, int totalShifts, BigDecimal overtimeAmount, List<SalaryAllowance> allowances, List<SalaryDeduction> deductions, String updatedBy) {
        Salary salary = salaryRepository.findById(payrollId).orElseThrow(() -> new IllegalArgumentException("Payroll not found"));
        if (salary.getStatus() == Salary.Status.PAID) throw new IllegalStateException("Cannot edit PAID payroll");
        salary.setTotalShifts(totalShifts);
        salary.getSalaryAllowances().clear();
        BigDecimal totalAllowances = salary.getBasicSalary();
        for (SalaryAllowance a : allowances) { a.setPayroll(salary); salary.getSalaryAllowances().add(a); totalAllowances = totalAllowances.add(a.getAllowanceAmount()); }
        salary.getSalaryDeductions().clear();
        BigDecimal totalDeductions = BigDecimal.ZERO;
        for (SalaryDeduction d : deductions) { d.setPayroll(salary); salary.getSalaryDeductions().add(d); totalDeductions = totalDeductions.add(d.getDeductionAmount()); }
        salary.setTotalAllowances(totalAllowances);
        salary.setTotalDeductions(totalDeductions);
        salary.setNetSalary(totalAllowances.subtract(totalDeductions));
        salary.setCalculatedBy(updatedBy);
        return salaryRepository.save(salary);
    }

    public List<AdvanceRequest> getUndeductedPaidAdvances(Long officerId, String month) {
        User officer = officerRepository.findById(officerId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        return advanceRequestRepository.findByUserAndForMonthAndStatusAndDeducted(officer, month, RequestStatus.PAID, false);
    }

    @Transactional
    public void markNotificationAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}


