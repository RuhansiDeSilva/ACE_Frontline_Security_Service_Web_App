package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.UniformRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.entity.UniformRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.UniformRequestRepository;
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
@DisplayName("UniformService – Unit Tests")
class UniformServiceTest extends BaseServiceTest {

    @Mock private UniformRequestRepository uniformRequestRepository;
    @Mock private UserRepository           userRepository;

    @InjectMocks
    private UniformService uniformService;

    // ── helpers ───────────────────────────────────────────────────────────────

    private UniformRequest uniformWithStatus(User officer, RequestStatus status) {
        return UniformRequest.builder()
                .id(400L)
                .user(officer)
                .uniformSize("L")
                .uniformType("Full Uniform")
                .quantity(2)
                .notes("Replace worn uniform")
                .status(status)
                .build();
    }

    private UniformRequestDto dto() {
        UniformRequestDto d = new UniformRequestDto();
        d.setUniformSize("L");
        d.setUniformType("Full Uniform");
        d.setQuantity(2);
        d.setNotes("Replace worn uniform");
        return d;
    }

    private ReviewRequest approve() {
        ReviewRequest r = new ReviewRequest(); r.setApproved(true); return r;
    }

    private ReviewRequest reject(String reason) {
        ReviewRequest r = new ReviewRequest(); r.setApproved(false);
        r.setRejectionReason(reason); return r;
    }

    // =========================================================================
    // requestUniform()
    // =========================================================================
    @Nested
    @DisplayName("requestUniform()")
    class RequestUniformTests {

        @Test
        @DisplayName("creates PENDING uniform request with all DTO fields mapped correctly")
        void requestUniform_validDto_createsPendingRequest() {
            User officer = aSecurityOfficer();
            UniformRequest saved = uniformWithStatus(officer, RequestStatus.PENDING);

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(uniformRequestRepository.save(any(UniformRequest.class))).thenReturn(saved);

            UniformRequest result = uniformService.requestUniform("officer_01", dto());

            assertThat(result.getStatus()).isEqualTo(RequestStatus.PENDING);
            assertThat(result.getUniformSize()).isEqualTo("L");
            assertThat(result.getUniformType()).isEqualTo("Full Uniform");
            assertThat(result.getQuantity()).isEqualTo(2);
            verify(uniformRequestRepository).save(any(UniformRequest.class));
        }

        @Test
        @DisplayName("creates request without optional notes field")
        void requestUniform_noNotes_createsRequest() {
            User officer = aSecurityOfficer();
            UniformRequestDto noNotes = dto();
            noNotes.setNotes(null);
            UniformRequest saved = uniformWithStatus(officer, RequestStatus.PENDING);
            saved.setNotes(null);

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(uniformRequestRepository.save(any(UniformRequest.class))).thenReturn(saved);

            UniformRequest result = uniformService.requestUniform("officer_01", noNotes);

            assertThat(result).isNotNull();
            assertThat(result.getNotes()).isNull();
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when username not found")
        void requestUniform_unknownUser_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> uniformService.requestUniform("ghost", dto()))
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
        @DisplayName("getMyRequests returns only the caller's uniform requests")
        void getMyRequests_returnsCallerRequests() {
            User officer = aSecurityOfficer();
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(uniformRequestRepository.findByUser(officer)).thenReturn(List.of(
                    uniformWithStatus(officer, RequestStatus.PENDING),
                    uniformWithStatus(officer, RequestStatus.APPROVED)));

            assertThat(uniformService.getMyRequests("officer_01")).hasSize(2);
        }

        @Test
        @DisplayName("getAllRequests returns every uniform request in the system")
        void getAllRequests_returnsAll() {
            when(uniformRequestRepository.findAll()).thenReturn(List.of(
                    uniformWithStatus(aSecurityOfficer(), RequestStatus.PENDING),
                    uniformWithStatus(aSecurityOfficer(), RequestStatus.APPROVED)));

            assertThat(uniformService.getAllRequests()).hasSize(2);
        }

        @Test
        @DisplayName("getPendingRequests returns only PENDING requests")
        void getPendingRequests_returnsPendingOnly() {
            when(uniformRequestRepository.findByStatus(RequestStatus.PENDING))
                    .thenReturn(List.of(uniformWithStatus(aSecurityOfficer(), RequestStatus.PENDING)));

            List<UniformRequest> result = uniformService.getPendingRequests();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(RequestStatus.PENDING);
        }

        @Test
        @DisplayName("getMyRequests throws ResourceNotFoundException for unknown username")
        void getMyRequests_unknownUser_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> uniformService.getMyRequests("ghost"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // reviewRequest()
    // =========================================================================
    @Nested
    @DisplayName("reviewRequest()")
    class ReviewRequestTests {

        @Test
        @DisplayName("executive officer approval sets APPROVED status and records reviewer")
        void reviewRequest_approve_setsApprovedAndRecordsReviewer() {
            User officer     = aSecurityOfficer();
            User execOfficer = anExecutiveOfficer();
            UniformRequest req = uniformWithStatus(officer, RequestStatus.PENDING);

            when(uniformRequestRepository.findById(400L)).thenReturn(Optional.of(req));
            when(userRepository.findByUsername("exec_officer_01")).thenReturn(Optional.of(execOfficer));
            when(uniformRequestRepository.save(any(UniformRequest.class))).thenReturn(req);

            UniformRequest result = uniformService.reviewRequest(400L, "exec_officer_01", approve());

            assertThat(result.getStatus()).isEqualTo(RequestStatus.APPROVED);
            assertThat(result.getReviewedBy()).isEqualTo(execOfficer);
            assertThat(result.getReviewedAt()).isNotNull();
        }

        @Test
        @DisplayName("rejection sets REJECTED status and persists rejection reason")
        void reviewRequest_reject_setsRejectedWithReason() {
            User officer     = aSecurityOfficer();
            User execOfficer = anExecutiveOfficer();
            UniformRequest req = uniformWithStatus(officer, RequestStatus.PENDING);

            when(uniformRequestRepository.findById(400L)).thenReturn(Optional.of(req));
            when(userRepository.findByUsername("exec_officer_01")).thenReturn(Optional.of(execOfficer));
            when(uniformRequestRepository.save(any(UniformRequest.class))).thenReturn(req);

            UniformRequest result = uniformService.reviewRequest(
                    400L, "exec_officer_01", reject("Stock unavailable – reorder pending"));

            assertThat(result.getStatus()).isEqualTo(RequestStatus.REJECTED);
            assertThat(result.getRejectionReason()).isEqualTo("Stock unavailable – reorder pending");
        }

        @Test
        @DisplayName("throws BusinessException when uniform request is already APPROVED")
        void reviewRequest_alreadyApproved_throwsBusinessException() {
            UniformRequest req = uniformWithStatus(aSecurityOfficer(), RequestStatus.APPROVED);
            when(uniformRequestRepository.findById(400L)).thenReturn(Optional.of(req));

            assertThatThrownBy(() -> uniformService.reviewRequest(400L, "exec_officer_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already processed");
        }

        @Test
        @DisplayName("throws BusinessException when uniform request is already REJECTED")
        void reviewRequest_alreadyRejected_throwsBusinessException() {
            UniformRequest req = uniformWithStatus(aSecurityOfficer(), RequestStatus.REJECTED);
            when(uniformRequestRepository.findById(400L)).thenReturn(Optional.of(req));

            assertThatThrownBy(() -> uniformService.reviewRequest(400L, "exec_officer_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already processed");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when uniform request ID does not exist")
        void reviewRequest_unknownId_throwsResourceNotFoundException() {
            when(uniformRequestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> uniformService.reviewRequest(999L, "exec_officer_01", approve()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Uniform request not found");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when reviewer username does not exist")
        void reviewRequest_unknownReviewer_throwsResourceNotFoundException() {
            UniformRequest req = uniformWithStatus(aSecurityOfficer(), RequestStatus.PENDING);
            when(uniformRequestRepository.findById(400L)).thenReturn(Optional.of(req));
            when(userRepository.findByUsername("ghost_exec")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> uniformService.reviewRequest(400L, "ghost_exec", approve()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Reviewer not found");
        }
    }
}