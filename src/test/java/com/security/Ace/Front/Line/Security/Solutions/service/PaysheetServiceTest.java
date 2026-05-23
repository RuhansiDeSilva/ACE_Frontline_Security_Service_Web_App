package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.PaysheetRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.Paysheet;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.PaysheetRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaysheetService – Unit Tests")
class PaysheetServiceTest extends BaseServiceTest {

    @Mock
    private PaysheetRepository paysheetRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PaysheetService paysheetService;

    // ── helpers ───────────────────────────────────────────────────────────────

    /**
     * Builds a fully-populated {@link PaysheetRequest}.
     * Net = 50000 + 3000 - 500 = 52500
     */
    private PaysheetRequest fullRequest() {
        PaysheetRequest req = new PaysheetRequest();
        req.setUserId(1L);
        req.setPayMonth("2024-02");
        req.setBasicSalary(50000.0);
        req.setAllowances(3000.0);
        req.setOtherDeductions(500.0);
        req.setRemarks("February 2024 paysheet");
        return req;
    }

    private Paysheet buildSavedPaysheet(User employee, User exec, double net) {
        return Paysheet.builder()
                .id(500L)
                .user(employee)
                .payMonth("2024-02")
                .basicSalary(50000.0)
                .allowances(3000.0)
                .otherDeductions(500.0)
                .netSalary(net)
                .remarks("February 2024 paysheet")
                .generatedBy(exec)
                .build();
    }

    // =========================================================================
    // generatePaysheet()
    // =========================================================================
    @Nested
    @DisplayName("generatePaysheet()")
    class GeneratePaysheetTests {

        @Test
        @DisplayName("calculates net salary correctly: basic + allowances - other deductions")
        void generatePaysheet_allFieldsProvided_calculatesNetSalaryCorrectly() {
            // Net = 50000 + 3000 - 500 = 52500
            User exec = anAccountExecutive();
            User officer = aSecurityOfficer();

            when(userRepository.findByUsername("acc_exec_01")).thenReturn(Optional.of(exec));
            when(userRepository.findById(1L)).thenReturn(Optional.of(officer));
            when(paysheetRepository.findByUserAndPayMonth(officer, "2024-02")).thenReturn(Optional.empty());
            when(paysheetRepository.save(any(Paysheet.class))).thenReturn(buildSavedPaysheet(officer, exec, 52500.0));

            Paysheet result = paysheetService.generatePaysheet("acc_exec_01", fullRequest());

            assertThat(result.getNetSalary()).isEqualTo(52500.0);
            assertThat(result.getPayMonth()).isEqualTo("2024-02");
            assertThat(result.getGeneratedBy()).isEqualTo(exec);
            verify(paysheetRepository).save(any(Paysheet.class));
        }

        @Test
        @DisplayName("falls back to employee's configured basicSalary when request omits it")
        void generatePaysheet_nullBasicSalaryInRequest_usesEmployeeSalary() {
            // officer.basicSalary = 50 000; no overrides in request
            User exec = anAccountExecutive();
            User officer = aSecurityOfficer();

            PaysheetRequest req = new PaysheetRequest();
            req.setUserId(1L);
            req.setPayMonth("2024-03");
            // all amounts null → defaults: basic=50000, others=0 → net=50000

            when(userRepository.findByUsername("acc_exec_01")).thenReturn(Optional.of(exec));
            when(userRepository.findById(1L)).thenReturn(Optional.of(officer));
            when(paysheetRepository.findByUserAndPayMonth(officer, "2024-03")).thenReturn(Optional.empty());
            when(paysheetRepository.save(any(Paysheet.class))).thenAnswer(inv -> {
                Paysheet ps = inv.getArgument(0);
                ps.setId(501L);
                return ps;
            });

            Paysheet result = paysheetService.generatePaysheet("acc_exec_01", req);

            assertThat(result.getBasicSalary()).isEqualTo(50000.0);
            assertThat(result.getNetSalary()).isEqualTo(50000.0);
        }

        @Test
        @DisplayName("uses 0.0 basic salary when both request and employee have no salary configured")
        void generatePaysheet_noSalaryAnywhere_usesZeroBasic() {
            User exec = anAccountExecutive();
            User officer = aSecurityOfficer();
            officer.setBasicSalary(null);

            PaysheetRequest req = new PaysheetRequest();
            req.setUserId(1L);
            req.setPayMonth("2024-04");

            when(userRepository.findByUsername("acc_exec_01")).thenReturn(Optional.of(exec));
            when(userRepository.findById(1L)).thenReturn(Optional.of(officer));
            when(paysheetRepository.findByUserAndPayMonth(officer, "2024-04")).thenReturn(Optional.empty());
            when(paysheetRepository.save(any(Paysheet.class))).thenAnswer(inv -> {
                Paysheet ps = inv.getArgument(0);
                ps.setId(502L);
                return ps;
            });

            Paysheet result = paysheetService.generatePaysheet("acc_exec_01", req);

            assertThat(result.getBasicSalary()).isEqualTo(0.0);
            assertThat(result.getNetSalary()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("throws BusinessException when paysheet already exists for the same month")
        void generatePaysheet_duplicateMonth_throwsBusinessException() {
            User exec = anAccountExecutive();
            User officer = aSecurityOfficer();
            Paysheet existing = buildSavedPaysheet(officer, exec, 54500.0);

            when(userRepository.findByUsername("acc_exec_01")).thenReturn(Optional.of(exec));
            when(userRepository.findById(1L)).thenReturn(Optional.of(officer));
            when(paysheetRepository.findByUserAndPayMonth(officer, "2024-02"))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> paysheetService.generatePaysheet("acc_exec_01", fullRequest()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Paysheet already generated for this month");

            verify(paysheetRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when account executive username not found")
        void generatePaysheet_unknownAccountExecutive_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("ghost_exec")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paysheetService.generatePaysheet("ghost_exec", fullRequest()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Account executive not found");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when target employee ID not found")
        void generatePaysheet_unknownEmployeeId_throwsResourceNotFoundException() {
            PaysheetRequest req = fullRequest();
            req.setUserId(999L);

            when(userRepository.findByUsername("acc_exec_01")).thenReturn(Optional.of(anAccountExecutive()));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paysheetService.generatePaysheet("acc_exec_01", req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Employee not found");
        }
    }

    // =========================================================================
    // getMyPaysheets()
    // =========================================================================
    @Nested
    @DisplayName("getMyPaysheets()")
    class GetMyPaysheetsTests {

        @Test
        @DisplayName("returns paysheets for the authenticated user ordered most-recent first")
        void getMyPaysheets_returnsOrderedList() {
            User exec = anAccountExecutive();
            User officer = aSecurityOfficer();
            List<Paysheet> sheets = List.of(
                    buildSavedPaysheet(officer, exec, 54500.0),
                    buildSavedPaysheet(officer, exec, 52000.0));

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(paysheetRepository.findByUserOrderByCreatedAtDesc(officer)).thenReturn(sheets);

            List<Paysheet> result = paysheetService.getMyPaysheets("officer_01");

            assertThat(result).hasSize(2);
            verify(paysheetRepository).findByUserOrderByCreatedAtDesc(officer);
        }

        @Test
        @DisplayName("returns empty list when employee has no paysheets yet")
        void getMyPaysheets_noPaysheets_returnsEmptyList() {
            User officer = aSecurityOfficer();
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(paysheetRepository.findByUserOrderByCreatedAtDesc(officer)).thenReturn(List.of());

            assertThat(paysheetService.getMyPaysheets("officer_01")).isEmpty();
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for unknown username")
        void getMyPaysheets_unknownUser_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paysheetService.getMyPaysheets("ghost"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // getPaysheetsByUser()
    // =========================================================================
    @Nested
    @DisplayName("getPaysheetsByUser()")
    class GetPaysheetsByUserTests {

        @Test
        @DisplayName("returns paysheets for the given employee user ID")
        void getPaysheetsByUser_existingId_returnsPaysheets() {
            User exec = anAccountExecutive();
            User officer = aSecurityOfficer();

            when(userRepository.findById(1L)).thenReturn(Optional.of(officer));
            when(paysheetRepository.findByUserOrderByCreatedAtDesc(officer))
                    .thenReturn(List.of(buildSavedPaysheet(officer, exec, 54500.0)));

            List<Paysheet> result = paysheetService.getPaysheetsByUser(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getNetSalary()).isEqualTo(54500.0);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for unknown user ID")
        void getPaysheetsByUser_unknownId_throwsResourceNotFoundException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paysheetService.getPaysheetsByUser(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // getAllPaysheets()
    // =========================================================================
    @Nested
    @DisplayName("getAllPaysheets()")
    class GetAllPaysheetsTests {

        @Test
        @DisplayName("returns all paysheets across every employee")
        void getAllPaysheets_returnsAll() {
            User exec = anAccountExecutive();
            User officer = aSecurityOfficer();
            when(paysheetRepository.findAll()).thenReturn(List.of(
                    buildSavedPaysheet(officer, exec, 54500.0),
                    buildSavedPaysheet(officer, exec, 48000.0)));

            List<Paysheet> result = paysheetService.getAllPaysheets();

            assertThat(result).hasSize(2);
            verify(paysheetRepository).findAll();
        }

        @Test
        @DisplayName("returns empty list when no paysheets have been generated yet")
        void getAllPaysheets_noPaysheets_returnsEmptyList() {
            when(paysheetRepository.findAll()).thenReturn(List.of());

            assertThat(paysheetService.getAllPaysheets()).isEmpty();
        }
    }
}