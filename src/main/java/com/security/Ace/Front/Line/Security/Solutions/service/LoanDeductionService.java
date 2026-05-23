package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.entity.LoanDeduction;
import com.security.Ace.Front.Line.Security.Solutions.entity.LoanRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.LoanDeductionRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.LoanRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LoanDeductionService {

    private final LoanDeductionRepository loanDeductionRepository;
    private final LoanRequestRepository loanRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Generates a deduction schedule after a loan is approved.
     * Splits the loan amount equally across repayment months.
     * Called automatically when ExecutiveOfficer approves a loan.
     */
    @Transactional
    public List<LoanDeduction> generateSchedule(Long loanId) {
        LoanRequest loan = loanRequestRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan request not found"));

        if (loan.getStatus() != RequestStatus.APPROVED) {
            throw new BusinessException("Can only generate schedule for approved loans");
        }

        // Prevent duplicate schedules
        if (loanDeductionRepository.existsByLoanRequest(loan)) {
            throw new BusinessException("Deduction schedule already exists for this loan");
        }

        int months = loan.getRepaymentMonths() != null ? loan.getRepaymentMonths() : 1;
        double totalAmount = loan.getAmount();
        double monthlyAmount = Math.floor(totalAmount / months * 100) / 100; // round down to 2 decimals
        double lastMonthAmount = totalAmount - (monthlyAmount * (months - 1)); // remainder goes to last month

        List<LoanDeduction> schedule = new ArrayList<>();
        LocalDate startMonth = LocalDate.now().plusMonths(1).withDayOfMonth(1); // start deductions next month

        for (int i = 0; i < months; i++) {
            LocalDate deductionDate = startMonth.plusMonths(i);
            String monthStr = deductionDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            double amount = (i == months - 1) ? lastMonthAmount : monthlyAmount;

            LoanDeduction deduction = LoanDeduction.builder()
                    .loanRequest(loan)
                    .user(loan.getUser())
                    .deductionMonth(monthStr)
                    .amount(amount)
                    .status("PENDING")
                    .build();

            schedule.add(deduction);
        }

        return loanDeductionRepository.saveAll(schedule);
    }

    /**
     * Get the full deduction schedule for a specific loan.
     */
    public List<LoanDeduction> getScheduleForLoan(Long loanId) {
        return loanDeductionRepository.findByLoanRequestId(loanId);
    }

    /**
     * Get all deductions for a specific user.
     */
    public List<LoanDeduction> getDeductionsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return loanDeductionRepository.findByUser(user);
    }

    /**
     * Get all pending deductions (for accountant dashboard).
     */
    public List<LoanDeduction> getAllPendingDeductions() {
        return loanDeductionRepository.findByStatus("PENDING");
    }

    /**
     * Get pending deductions for a specific month (for payroll processing).
     */
    public List<LoanDeduction> getPendingDeductionsForMonth(String month) {
        return loanDeductionRepository.findByDeductionMonthAndStatus(month, "PENDING");
    }

    /**
     * Get all deductions (pending + paid) for all loans.
     */
    public List<LoanDeduction> getAllDeductions() {
        return loanDeductionRepository.findAll();
    }

    /**
     * Get all deductions (pending + paid) for a specific month.
     * Used by payroll generation page to auto-fill loan deductions.
     */
    public List<LoanDeduction> getDeductionsForMonth(String month) {
        return loanDeductionRepository.findByDeductionMonth(month);
    }

    /**
     * Mark a deduction as paid (when accountant processes payroll).
     * Sends a notification to the loan applicant.
     * If all deductions for the loan are now paid, marks the loan as COMPLETED
     * and removes the deduction schedule.
     */
    @Transactional
    public LoanDeduction markAsPaid(Long deductionId, String processedByUsername) {
        LoanDeduction deduction = loanDeductionRepository.findById(deductionId)
                .orElseThrow(() -> new ResourceNotFoundException("Deduction not found"));

        if ("PAID".equals(deduction.getStatus())) {
            throw new BusinessException("Deduction is already paid");
        }

        User processedBy = userRepository.findByUsername(processedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        deduction.setStatus("PAID");
        deduction.setProcessedBy(processedBy);
        deduction.setProcessedAt(LocalDateTime.now());

        LoanDeduction saved = loanDeductionRepository.save(deduction);

        // Send notification to the loan applicant
        LoanRequest loan = deduction.getLoanRequest();
        User applicant = deduction.getUser();
        String monthLabel = deduction.getDeductionMonth();
        long amountInt = Math.round(deduction.getAmount());

        notificationService.notifyUser(
                applicant.getId(),
                "💰 Your loan deduction of LKR " + String.format("%,d", amountInt)
                        + " for month " + monthLabel + " (Loan #" + loan.getId()
                        + ") has been processed.");

        // Check if all deductions for this loan are now paid
        long pendingCount = loanDeductionRepository.countByLoanRequestAndStatus(loan, "PENDING");
        if (pendingCount == 0) {
            // All deductions paid — mark loan as COMPLETED
            loan.setStatus(RequestStatus.COMPLETED);
            loanRequestRepository.save(loan);

            // Delete the deduction schedule (clean up)
            loanDeductionRepository.deleteByLoanRequest(loan);

            // Notify the applicant about completion
            notificationService.notifyUser(
                    applicant.getId(),
                    "🎉 Congratulations! Your loan #" + loan.getId()
                            + " (LKR " + String.format("%,d", Math.round(loan.getAmount()))
                            + ") has been fully repaid. The deduction schedule has been removed.");
        }

        return saved;
    }

    /**
     * Get total pending loan deduction amount for a user in a given month.
     * Used by PaysheetService to auto-calculate deductions.
     */
    public Double getPendingLoanDeductionForUserMonth(String username, String month) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return loanDeductionRepository.sumPendingDeductionsForUserAndMonth(user, month);
    }

    /**
     * Get remaining balance for a loan.
     */
    public Double getRemainingBalance(Long loanId) {
        LoanRequest loan = loanRequestRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        return loanDeductionRepository.sumPendingForLoan(loan);
    }

    /**
     * Get loan deduction statistics for director dashboard.
     */
    public Map<String, Object> getLoanStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Loan request counts
        long totalLoans = loanRequestRepository.count();
        long approvedLoans = loanRequestRepository.countByStatus(RequestStatus.APPROVED);
        long pendingLoans = loanRequestRepository.countByStatus(RequestStatus.PENDING);
        long rejectedLoans = loanRequestRepository.countByStatus(RequestStatus.REJECTED);
        long completedLoans = loanRequestRepository.countByStatus(RequestStatus.COMPLETED);

        stats.put("totalLoans", totalLoans);
        stats.put("approvedLoans", approvedLoans);
        stats.put("pendingLoans", pendingLoans);
        stats.put("rejectedLoans", rejectedLoans);
        stats.put("completedLoans", completedLoans);

        // Deduction amounts
        Double totalRecovered = loanDeductionRepository.sumAmountByStatus("PAID");
        Double totalOutstanding = loanDeductionRepository.sumAmountByStatus("PENDING");
        long paidDeductions = loanDeductionRepository.countByStatus("PAID");
        long pendingDeductions = loanDeductionRepository.countByStatus("PENDING");

        stats.put("totalRecovered", totalRecovered != null ? totalRecovered : 0.0);
        stats.put("totalOutstanding", totalOutstanding != null ? totalOutstanding : 0.0);
        stats.put("totalDisbursed",
                (totalRecovered != null ? totalRecovered : 0.0)
                        + (totalOutstanding != null ? totalOutstanding : 0.0));
        stats.put("paidDeductions", paidDeductions);
        stats.put("pendingDeductions", pendingDeductions);
        stats.put("activeSchedules", approvedLoans); // loans with active deduction schedules

        return stats;
    }
}
