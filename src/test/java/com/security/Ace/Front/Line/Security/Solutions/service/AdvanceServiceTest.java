package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.AdvanceRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdvanceRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdvanceService – Unit Tests")
class AdvanceServiceTest extends BaseServiceTest {

    @Mock private AdvanceRequestRepository advanceRequestRepository;
    @Mock private UserRepository           userRepository;

    @InjectMocks
    private AdvanceService advanceService;

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Freeze {@link LocalDate#now()} to a fixed date inside a test body. */
    private void withDate(LocalDate date, Runnable test) {
        try (MockedStatic<LocalDate> mock = mockStatic(LocalDate.class, CALLS_REAL_METHODS)) {
            mock.when(LocalDate::now).thenReturn(date);
            test.run();
        }
    }

    private AdvanceRequest advanceWithStatus(User officer, RequestStatus status) {
        return AdvanceRequest.builder()
                .id(200L)
                .user(officer)
                .amount(4000.0)
                .reason("Urgent medical expense")
                .forMonth("2024-02")
                .status(status)
                .build();
    }

    private AdvanceRequestDto dto(double amount) {
        AdvanceRequestDto dto = new AdvanceRequestDto();
        dto.setAmount(amount);
        dto.setReason("Monthly expense");
        return dto;
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
    // requestAdvance() – business rules
    // =========================================================================
    @Nested
    @DisplayName("requestAdvance()")
    class RequestAdvanceTests {

        @Test
        @DisplayName("creates PENDING request when amount ≤10% of basic salary and date <15th")
        void requestAdvance_withinLimitBeforeDeadline_createsPendingRequest() {
            // basicSalary=50000, 10%=5000; requesting 4000 on the 5th
            withDate(LocalDate.of(2024, 2, 5), () -> {
                User officer = aSecurityOfficer();   // basicSalary = 50 000
                AdvanceRequest saved = advanceWithStatus(officer, RequestStatus.PENDING);

                when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
                when(advanceRequestRepository.existsByUserAndForMonthAndStatusNot(
                        eq(officer), eq("2024-02"), eq(RequestStatus.REJECTED))).thenReturn(false);
                when(advanceRequestRepository.save(any())).thenReturn(saved);

                AdvanceRequest result = advanceService.requestAdvance("officer_01", dto(4000.0));

                assertThat(result.getStatus()).isEqualTo(RequestStatus.PENDING);
                verify(advanceRequestRepository).save(any(AdvanceRequest.class));
            });
        }

        @Test
        @DisplayName("accepts request on exactly the 14th (boundary – still allowed)")
        void requestAdvance_on14th_isAccepted() {
            withDate(LocalDate.of(2024, 2, 14), () -> {
                User officer = aSecurityOfficer();
                when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
                when(advanceRequestRepository.existsByUserAndForMonthAndStatusNot(
                        any(), any(), any())).thenReturn(false);
                when(advanceRequestRepository.save(any())).thenReturn(advanceWithStatus(officer, RequestStatus.PENDING));

                assertThatNoException().isThrownBy(
                        () -> advanceService.requestAdvance("officer_01", dto(3000.0)));
            });
        }

        @Test
        @DisplayName("throws BusinessException on 15th (boundary – deadline exceeded)")
        void requestAdvance_on15th_throwsBusinessException() {
            withDate(LocalDate.of(2024, 2, 15), () -> {
                when(userRepository.findByUsername("officer_01"))
                        .thenReturn(Optional.of(aSecurityOfficer()));

                assertThatThrownBy(() -> advanceService.requestAdvance("officer_01", dto(2000.0)))
                        .isInstanceOf(BusinessException.class)
                        .hasMessageContaining("before the 15th of the month");
            });
        }

        @Test
        @DisplayName("throws BusinessException when amount exceeds 10% cap")
        void requestAdvance_amountAbove10Percent_throwsBusinessException() {
            // basicSalary=50000, cap=5000; requesting 5001
            withDate(LocalDate.of(2024, 2, 5), () -> {
                when(userRepository.findByUsername("officer_01"))
                        .thenReturn(Optional.of(aSecurityOfficer()));

                assertThatThrownBy(() -> advanceService.requestAdvance("officer_01", dto(5001.0)))
                        .isInstanceOf(BusinessException.class)
                        .hasMessageContaining("cannot exceed 10%");
            });
        }

        @Test
        @DisplayName("accepts amount at exactly 10% cap (boundary – allowed)")
        void requestAdvance_amountExactly10Percent_isAccepted() {
            withDate(LocalDate.of(2024, 2, 5), () -> {
                User officer = aSecurityOfficer();   // basicSalary=50000, cap=5000
                when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
                when(advanceRequestRepository.existsByUserAndForMonthAndStatusNot(
                        any(), any(), any())).thenReturn(false);
                when(advanceRequestRepository.save(any()))
                        .thenReturn(advanceWithStatus(officer, RequestStatus.PENDING));

                assertThatNoException().isThrownBy(
                        () -> advanceService.requestAdvance("officer_01", dto(5000.0)));
            });
        }

        @Test
        @DisplayName("throws BusinessException when a non-rejected advance already exists for the month")
        void requestAdvance_duplicateMonth_throwsBusinessException() {
            withDate(LocalDate.of(2024, 2, 5), () -> {
                User officer = aSecurityOfficer();
                when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
                when(advanceRequestRepository.existsByUserAndForMonthAndStatusNot(
                        eq(officer), anyString(), eq(RequestStatus.REJECTED))).thenReturn(true);

                assertThatThrownBy(() -> advanceService.requestAdvance("officer_01", dto(2000.0)))
                        .isInstanceOf(BusinessException.class)
                        .hasMessageContaining("Advance already requested for this month");
            });
        }

        @Test
        @DisplayName("throws BusinessException when employee has no configured basic salary")
        void requestAdvance_nullBasicSalary_throwsBusinessException() {
            withDate(LocalDate.of(2024, 2, 5), () -> {
                User officer = aSecurityOfficer();
                officer.setBasicSalary(null);
                when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));

                assertThatThrownBy(() -> advanceService.requestAdvance("officer_01", dto(2000.0)))
                        .isInstanceOf(BusinessException.class)
                        .hasMessageContaining("Basic salary not configured");
            });
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for unknown username")
        void requestAdvance_unknownUser_throwsResourceNotFoundException() {
            withDate(LocalDate.of(2024, 2, 5), () -> {
                when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

                assertThatThrownBy(() -> advanceService.requestAdvance("ghost", dto(2000.0)))
                        .isInstanceOf(ResourceNotFoundException.class);
            });
        }
    }

    // =========================================================================
    // Query methods
    // =========================================================================
    @Nested
    @DisplayName("Query methods")
    class QueryTests {

        @Test
        @DisplayName("getMyAdvances returns caller's own advances")
        void getMyAdvances_returnsCallerAdvances() {
            User officer = aSecurityOfficer();
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(advanceRequestRepository.findByUser(officer)).thenReturn(
                    List.of(advanceWithStatus(officer, RequestStatus.PENDING),
                            advanceWithStatus(officer, RequestStatus.APPROVED)));

            assertThat(advanceService.getMyAdvances("officer_01")).hasSize(2);
        }

        @Test
        @DisplayName("getAllAdvances returns every advance in the system")
        void getAllAdvances_returnsAll() {
            when(advanceRequestRepository.findAll()).thenReturn(List.of(
                    advanceWithStatus(aSecurityOfficer(), RequestStatus.PENDING)));

            assertThat(advanceService.getAllAdvances()).hasSize(1);
        }

        @Test
        @DisplayName("getAdvancesByArea returns advances for the given area only")
        void getAdvancesByArea_returnsMatchingArea() {
            when(advanceRequestRepository.findByUserAssignedArea("Colombo-North"))
                    .thenReturn(List.of(advanceWithStatus(aSecurityOfficer(), RequestStatus.PENDING)));

            assertThat(advanceService.getAdvancesByArea("Colombo-North")).hasSize(1);
        }

        @Test
        @DisplayName("getPendingAdvances returns only PENDING advances")
        void getPendingAdvances_returnsPendingOnly() {
            when(advanceRequestRepository.findByStatus(RequestStatus.PENDING))
                    .thenReturn(List.of(advanceWithStatus(aSecurityOfficer(), RequestStatus.PENDING)));

            List<AdvanceRequest> result = advanceService.getPendingAdvances();

            assertThat(result).allMatch(a -> a.getStatus() == RequestStatus.PENDING);
        }
    }

    // =========================================================================
    // areaManagerReview()
    // =========================================================================
    @Nested
    @DisplayName("areaManagerReview()")
    class AreaManagerReviewTests {

        @Test
        @DisplayName("approval transitions PENDING → APPROVED_BY_AREA_MANAGER and records reviewer")
        void areaManagerReview_approve_transitionsStatus() {
            User officer = aSecurityOfficer();
            User manager = anAreaManager();
            AdvanceRequest advance = advanceWithStatus(officer, RequestStatus.PENDING);

            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(manager));
            when(advanceRequestRepository.findById(200L)).thenReturn(Optional.of(advance));
            when(advanceRequestRepository.save(any())).thenReturn(advance);

            AdvanceRequest result = advanceService.areaManagerReview(200L, "area_mgr_01", approve());

            assertThat(result.getStatus()).isEqualTo(RequestStatus.APPROVED_BY_AREA_MANAGER);
            assertThat(result.getReviewedBy()).isEqualTo(manager);
        }

        @Test
        @DisplayName("rejection sets REJECTED status and stores reason")
        void areaManagerReview_reject_storesRejectionReason() {
            User officer = aSecurityOfficer();
            User manager = anAreaManager();
            AdvanceRequest advance = advanceWithStatus(officer, RequestStatus.PENDING);

            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(manager));
            when(advanceRequestRepository.findById(200L)).thenReturn(Optional.of(advance));
            when(advanceRequestRepository.save(any())).thenReturn(advance);

            AdvanceRequest result = advanceService.areaManagerReview(
                    200L, "area_mgr_01", reject("Budget constraint"));

            assertThat(result.getStatus()).isEqualTo(RequestStatus.REJECTED);
            assertThat(result.getRejectionReason()).isEqualTo("Budget constraint");
        }

        @Test
        @DisplayName("throws BusinessException when reviewer role is not AREA_MANAGER")
        void areaManagerReview_wrongRole_throwsBusinessException() {
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(aSecurityOfficer()));

            assertThatThrownBy(() -> advanceService.areaManagerReview(200L, "officer_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Only area managers");
        }

        @Test
        @DisplayName("throws BusinessException when advance is not PENDING")
        void areaManagerReview_notPending_throwsBusinessException() {
            User officer = aSecurityOfficer();
            AdvanceRequest advance = advanceWithStatus(officer, RequestStatus.APPROVED_BY_AREA_MANAGER);

            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(anAreaManager()));
            when(advanceRequestRepository.findById(200L)).thenReturn(Optional.of(advance));

            assertThatThrownBy(() -> advanceService.areaManagerReview(200L, "area_mgr_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not in PENDING status");
        }

        @Test
        @DisplayName("throws BusinessException when advance officer is outside manager's area")
        void areaManagerReview_differentArea_throwsBusinessException() {
            User officer = aSecurityOfficer();
            officer.setAssignedArea("Kurunegala");
            AdvanceRequest advance = advanceWithStatus(officer, RequestStatus.PENDING);

            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(anAreaManager()));
            when(advanceRequestRepository.findById(200L)).thenReturn(Optional.of(advance));

            assertThatThrownBy(() -> advanceService.areaManagerReview(200L, "area_mgr_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("your assigned area");
        }
    }

    // =========================================================================
    // finalReview()
    // =========================================================================
    @Nested
    @DisplayName("finalReview()")
    class FinalReviewTests {

        @Test
        @DisplayName("account executive grants final approval → APPROVED")
        void finalReview_approve_setsApproved() {
            User officer = aSecurityOfficer();
            AdvanceRequest advance = advanceWithStatus(officer, RequestStatus.APPROVED_BY_AREA_MANAGER);

            when(advanceRequestRepository.findById(200L)).thenReturn(Optional.of(advance));
            when(userRepository.findByUsername("acc_exec_01")).thenReturn(Optional.of(anAccountExecutive()));
            when(advanceRequestRepository.save(any())).thenReturn(advance);

            AdvanceRequest result = advanceService.finalReview(200L, "acc_exec_01", approve());

            assertThat(result.getStatus()).isEqualTo(RequestStatus.APPROVED);
        }

        @Test
        @DisplayName("throws BusinessException when advance is still PENDING (area review skipped)")
        void finalReview_pendingAdvance_throwsBusinessException() {
            AdvanceRequest advance = advanceWithStatus(aSecurityOfficer(), RequestStatus.PENDING);
            when(advanceRequestRepository.findById(200L)).thenReturn(Optional.of(advance));

            assertThatThrownBy(() -> advanceService.finalReview(200L, "acc_exec_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("area manager first");
        }

        @Test
        @DisplayName("throws BusinessException when advance is already APPROVED")
        void finalReview_alreadyApproved_throwsBusinessException() {
            AdvanceRequest advance = advanceWithStatus(aSecurityOfficer(), RequestStatus.APPROVED);
            when(advanceRequestRepository.findById(200L)).thenReturn(Optional.of(advance));

            assertThatThrownBy(() -> advanceService.finalReview(200L, "acc_exec_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already finalized");
        }

        @Test
        @DisplayName("throws BusinessException when advance is already REJECTED")
        void finalReview_alreadyRejected_throwsBusinessException() {
            AdvanceRequest advance = advanceWithStatus(aSecurityOfficer(), RequestStatus.REJECTED);
            when(advanceRequestRepository.findById(200L)).thenReturn(Optional.of(advance));

            assertThatThrownBy(() -> advanceService.finalReview(200L, "acc_exec_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already finalized");
        }
    }
}