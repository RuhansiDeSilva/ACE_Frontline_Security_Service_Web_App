package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoanRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.LoanRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.LoanRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRequestRepository loanRequestRepository;
    private final UserRepository userRepository;
    private final LoanDeductionService loanDeductionService;
    private final NotificationService notificationService;

    @Transactional
    public LoanRequest requestLoan(String username, LoanRequestDto dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        LoanRequest loan = LoanRequest.builder()
                .user(user)
                .amount(dto.getAmount())
                .reason(dto.getReason())
                .repaymentMonths(dto.getRepaymentMonths())
                .status(RequestStatus.PENDING)
                .build();

        return loanRequestRepository.save(loan);
    }

    public List<LoanRequest> getMyLoans(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return loanRequestRepository.findByUser(user);
    }

    public List<LoanRequest> getAllLoans() {
        return loanRequestRepository.findAll();
    }

    public List<LoanRequest> getPendingLoans() {
        return loanRequestRepository.findByStatus(RequestStatus.PENDING);
    }

    public List<LoanRequest> getApprovedLoans() {
        return loanRequestRepository.findByStatus(RequestStatus.APPROVED);
    }

    @Transactional
    public LoanRequest reviewLoan(Long loanId, String reviewerUsername, ReviewRequest reviewRequest) {
        LoanRequest loan = loanRequestRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan request not found"));

        if (loan.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Loan request is already processed");
        }

        User reviewer = userRepository.findByUsername(reviewerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found"));

        if (reviewRequest.isApproved()) {
            loan.setStatus(RequestStatus.APPROVED);
        } else {
            loan.setStatus(RequestStatus.REJECTED);
            loan.setRejectionReason(reviewRequest.getRejectionReason());
        }

        loan.setReviewedBy(reviewer);
        loan.setReviewedAt(LocalDateTime.now());
        LoanRequest saved = loanRequestRepository.save(loan);

        // Send notification to loan requester
        if (saved.getStatus() == RequestStatus.APPROVED) {
            try {
                notificationService.notifyUser(saved.getUser().getId(),
                    "Your loan request for LKR " + saved.getAmount() + " has been approved. Repayment period: " + saved.getRepaymentMonths() + " months.");
            } catch (Exception e) {
                System.err.println("Failed to send approval notification: " + e.getMessage());
            }
            // Auto-generate deduction schedule when approved
            loanDeductionService.generateSchedule(saved.getId());
        } else {
            try {
                notificationService.notifyUser(saved.getUser().getId(),
                    "Your loan request for LKR " + saved.getAmount() + " has been rejected. Reason: " + saved.getRejectionReason());
            } catch (Exception e) {
                System.err.println("Failed to send rejection notification: " + e.getMessage());
            }
        }

        return saved;
    }
}
