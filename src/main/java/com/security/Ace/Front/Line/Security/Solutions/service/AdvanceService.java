package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.AdvanceRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.Designation;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdvanceRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdvanceService {

    private final AdvanceRequestRepository advanceRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public AdvanceRequest requestAdvance(String username, AdvanceRequestDto dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Business rule: request only before 15th of the month
        LocalDate today = LocalDate.now();
        if (today.getDayOfMonth() >= 15) {
            throw new BusinessException("Advance requests can only be made before the 15th of the month");
        }

        // Business rule: max advance based on designation/role
        double maxAmount = getMaxAdvanceAmount(user);
        if (dto.getAmount() > maxAmount) {
            throw new BusinessException(String.format(
                    "Advance amount cannot exceed %.2f for your designation", maxAmount));
        }

        String forMonth = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Check if already requested for this month
        boolean alreadyRequested = advanceRequestRepository
                .existsByUserAndForMonthAndStatusNot(user, forMonth, RequestStatus.REJECTED);
        if (alreadyRequested) {
            throw new BusinessException("Advance already requested for this month");
        }

        AdvanceRequest advance = AdvanceRequest.builder()
                .user(user)
                .amount(dto.getAmount())
                .reason(dto.getReason())
                .forMonth(forMonth)
                .status(RequestStatus.PENDING)
                .build();

        return advanceRequestRepository.save(advance);
    }

    public List<AdvanceRequest> getMyAdvances(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return advanceRequestRepository.findByUser(user);
    }

    public List<AdvanceRequest> getAllAdvances() {
        return advanceRequestRepository.findAll();
    }

    public List<AdvanceRequest> getAdvancesByArea(String area) {
        return advanceRequestRepository.findByUserAssignedArea(area);
    }

    public List<AdvanceRequest> getPendingAdvances() {
        return advanceRequestRepository.findByStatus(RequestStatus.PENDING);
    }

    public List<AdvanceRequest> getPendingAdvancesForArea(String area) {
        return advanceRequestRepository.findByUserAssignedAreaAndStatus(area, RequestStatus.PENDING);
    }

    public List<AdvanceRequest> getAwaitingFinalReview() {
        return advanceRequestRepository.findByStatus(RequestStatus.APPROVED_BY_AREA_MANAGER);
    }

    public List<AdvanceRequest> getApprovedAdvances() {
        return advanceRequestRepository.findByStatus(RequestStatus.APPROVED);
    }

    @Transactional
    public AdvanceRequest areaManagerReview(Long advanceId, String managerUsername, ReviewRequest reviewRequest) {
        User manager = userRepository.findByUsername(managerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        if (!"AREA_MANAGER".equals(manager.getRole())) {
            throw new BusinessException("Only area managers can do first-level review");
        }

        AdvanceRequest advance = advanceRequestRepository.findById(advanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Advance request not found"));

        if (advance.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Advance request is not in PENDING status");
        }

        if (!advance.getUser().getAssignedArea().equals(manager.getAssignedArea())) {
            throw new BusinessException("You can only review advance requests for your assigned area");
        }

        if (reviewRequest.isApproved()) {
            advance.setStatus(RequestStatus.APPROVED);
        } else {
            advance.setStatus(RequestStatus.REJECTED);
            advance.setRejectionReason(reviewRequest.getRejectionReason());
        }

        advance.setAreaReviewedBy(manager);
        advance.setAreaReviewedAt(LocalDateTime.now());
        advance.setReviewedBy(manager);
        advance.setReviewedAt(LocalDateTime.now());
        return advanceRequestRepository.save(advance);
    }

    // Account Executive final approval
    @Transactional
    public AdvanceRequest finalReview(Long advanceId, String reviewerUsername, ReviewRequest reviewRequest) {
        AdvanceRequest advance = advanceRequestRepository.findById(advanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Advance request not found"));

        if (advance.getStatus() == RequestStatus.PENDING) {
            throw new BusinessException("Advance must be reviewed by area manager first");
        }
        if (advance.getStatus() == RequestStatus.REJECTED || advance.getStatus() == RequestStatus.APPROVED) {
            throw new BusinessException("Advance request is already finalized");
        }

        User reviewer = userRepository.findByUsername(reviewerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found"));

        if (reviewRequest.isApproved()) {
            advance.setStatus(RequestStatus.APPROVED);
        } else {
            advance.setStatus(RequestStatus.REJECTED);
            advance.setRejectionReason(reviewRequest.getRejectionReason());
        }

        advance.setReviewedBy(reviewer);
        advance.setReviewedAt(LocalDateTime.now());
        return advanceRequestRepository.save(advance);
    }

    /**
     * Calculate max advance amount based on user's role and designation.
     * Area Managers: Rs. 15,000
     * JSO / LSO:     Rs. 4,000
     * OIC / CSO:     Rs. 6,000
     * Others:        Rs. 10,000 (or 10% of basic salary if available)
     */
    private double getMaxAdvanceAmount(User user) {
        if ("AREA_MANAGER".equals(user.getRole())) {
            return 15000.0;
        }

        if (user.getDesignation() != null) {
            try {
                Designation des = Designation.valueOf(user.getDesignation());
                switch (des) {
                    case JSO:
                    case LSO:
                        return 4000.0;
                    case ISO:
                        return 5000.0;
                    case CSO:
                        return 6000.0;
                    case SSO:
                        return 10000.0;
                    default:
                        break;
                }
            } catch (IllegalArgumentException | NullPointerException e) {
                // Ignore and use fallback
            }
        }

        // Fallback: 10% of basic salary or default cap
        if (user.getBasicSalary() != null) {
            return user.getBasicSalary() * 0.10;
        }
        return 10000.0;
    }
}
