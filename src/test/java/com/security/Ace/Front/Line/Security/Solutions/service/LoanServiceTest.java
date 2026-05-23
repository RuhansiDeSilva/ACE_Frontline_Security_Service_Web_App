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
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LoanService – Unit Tests")
class LoanServiceTest extends BaseServiceTest {

    @Mock
    private LoanRequestRepository loanRequestRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LoanDeductionService loanDeductionService;

    @InjectMocks
    private LoanService loanService;

    // ── helpers ───────────────────────────────────────────────────────────────

    private LoanRequest loanWithStatus(User officer, RequestStatus status) {
        return LoanRequest.builder()
                .id(300L)
                .user(officer)
                .amount(200000.0)
                .reason("Home renovation")
                .repaymentMonths(24)
                .status(status)
                .build();
    }

    private LoanRequestDto dto() {
        LoanRequestDto d = new LoanRequestDto();
        d.setAmount(200000.0);
        d.setReason("Home renovation");
        d.setRepaymentMonths(24);
        return d;
    }

    private ReviewRequest approve() {
        ReviewRequest r = new ReviewRequest();
        r.setApproved(true);
        return r;
    }

    private ReviewRequest reject(String reason) {
        ReviewRequest r = new ReviewRequest();
        r.setApproved(false);
        r.setRejectionReason(reason);
        return r;
    }

    // =========================================================================
    // requestLoan()
    // =========================================================================
    @Nested
    @DisplayName("requestLoan()")
    class RequestLoanTests {

        @Test
        @DisplayName("creates PENDING loan request with correct fields")
        void requestLoan_validRequest_createsPendingLoan() {
            User officer = aSecurityOfficer();
            LoanRequest saved = loanWithStatus(officer, RequestStatus.PENDING);

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(loanRequestRepository.save(any(LoanRequest.class))).thenReturn(saved);

            LoanRequest result = loanService.requestLoan("officer_01", dto());

            assertThat(result.getStatus()).isEqualTo(RequestStatus.PENDING);
            assertThat(result.getAmount()).isEqualTo(200000.0);
            assertThat(result.getRepaymentMonths()).isEqualTo(24);
            verify(loanRequestRepository).save(any(LoanRequest.class));
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for unknown username")
        void requestLoan_unknownUser_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> loanService.requestLoan("ghost", dto()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // Query methods
    // =========================================================================
    @Nested
    @DisplayName("Query methods")
    class QueryTests {

        @Test
        @DisplayName("getMyLoans returns only the caller's loan records")
        void getMyLoans_returnsCallerLoans() {
            User officer = aSecurityOfficer();
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(loanRequestRepository.findByUser(officer)).thenReturn(List.of(
                    loanWithStatus(officer, RequestStatus.PENDING),
                    loanWithStatus(officer, RequestStatus.APPROVED)));

            assertThat(loanService.getMyLoans("officer_01")).hasSize(2);
        }

        @Test
        @DisplayName("getAllLoans returns every loan in the system")
        void getAllLoans_returnsAll() {
            when(loanRequestRepository.findAll()).thenReturn(List.of(
                    loanWithStatus(aSecurityOfficer(), RequestStatus.PENDING),
                    loanWithStatus(aSecurityOfficer(), RequestStatus.APPROVED),
                    loanWithStatus(aSecurityOfficer(), RequestStatus.REJECTED)));

            assertThat(loanService.getAllLoans()).hasSize(3);
        }

        @Test
        @DisplayName("getPendingLoans returns only PENDING loans")
        void getPendingLoans_returnsPendingOnly() {
            when(loanRequestRepository.findByStatus(RequestStatus.PENDING))
                    .thenReturn(List.of(loanWithStatus(aSecurityOfficer(), RequestStatus.PENDING)));

            List<LoanRequest> result = loanService.getPendingLoans();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(RequestStatus.PENDING);
        }

        @Test
        @DisplayName("getApprovedLoans returns only APPROVED loans")
        void getApprovedLoans_returnsApprovedOnly() {
            when(loanRequestRepository.findByStatus(RequestStatus.APPROVED))
                    .thenReturn(List.of(loanWithStatus(aSecurityOfficer(), RequestStatus.APPROVED)));

            List<LoanRequest> result = loanService.getApprovedLoans();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(RequestStatus.APPROVED);
        }

        @Test
        @DisplayName("getMyLoans throws ResourceNotFoundException for unknown username")
        void getMyLoans_unknownUser_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> loanService.getMyLoans("ghost"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // reviewLoan()
    // =========================================================================
    @Nested
    @DisplayName("reviewLoan()")
    class ReviewLoanTests {

        @Test
        @DisplayName("account executive approval sets APPROVED status and records reviewer")
        void reviewLoan_approve_setsApprovedAndRecordsReviewer() {
            User officer = aSecurityOfficer();
            User exec = anAccountExecutive();
            LoanRequest loan = loanWithStatus(officer, RequestStatus.PENDING);

            when(loanRequestRepository.findById(300L)).thenReturn(Optional.of(loan));
            when(userRepository.findByUsername("acc_exec_01")).thenReturn(Optional.of(exec));
            when(loanRequestRepository.save(any(LoanRequest.class))).thenReturn(loan);

            LoanRequest result = loanService.reviewLoan(300L, "acc_exec_01", approve());

            assertThat(result.getStatus()).isEqualTo(RequestStatus.APPROVED);
            assertThat(result.getReviewedBy()).isEqualTo(exec);
            assertThat(result.getReviewedAt()).isNotNull();
        }

        @Test
        @DisplayName("executive officer rejection sets REJECTED with reason")
        void reviewLoan_reject_setsRejectedWithReason() {
            User officer = aSecurityOfficer();
            User execOfficer = anExecutiveOfficer();
            LoanRequest loan = loanWithStatus(officer, RequestStatus.PENDING);

            when(loanRequestRepository.findById(300L)).thenReturn(Optional.of(loan));
            when(userRepository.findByUsername("exec_officer_01")).thenReturn(Optional.of(execOfficer));
            when(loanRequestRepository.save(any(LoanRequest.class))).thenReturn(loan);

            LoanRequest result = loanService.reviewLoan(
                    300L, "exec_officer_01", reject("Exceeds eligibility limit"));

            assertThat(result.getStatus()).isEqualTo(RequestStatus.REJECTED);
            assertThat(result.getRejectionReason()).isEqualTo("Exceeds eligibility limit");
        }

        @Test
        @DisplayName("throws BusinessException when loan is already APPROVED")
        void reviewLoan_alreadyApproved_throwsBusinessException() {
            LoanRequest loan = loanWithStatus(aSecurityOfficer(), RequestStatus.APPROVED);
            when(loanRequestRepository.findById(300L)).thenReturn(Optional.of(loan));

            assertThatThrownBy(() -> loanService.reviewLoan(300L, "acc_exec_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already processed");
        }

        @Test
        @DisplayName("throws BusinessException when loan is already REJECTED")
        void reviewLoan_alreadyRejected_throwsBusinessException() {
            LoanRequest loan = loanWithStatus(aSecurityOfficer(), RequestStatus.REJECTED);
            when(loanRequestRepository.findById(300L)).thenReturn(Optional.of(loan));

            assertThatThrownBy(() -> loanService.reviewLoan(300L, "acc_exec_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already processed");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when loan ID does not exist")
        void reviewLoan_unknownId_throwsResourceNotFoundException() {
            when(loanRequestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> loanService.reviewLoan(999L, "acc_exec_01", approve()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Loan request not found");
        }
    }
}