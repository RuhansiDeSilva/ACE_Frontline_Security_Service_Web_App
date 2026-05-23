package com.security.Ace.Front.Line.Security.Solutions.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.security.Ace.Front.Line.Security.Solutions.entity.BankDetails;
import com.security.Ace.Front.Line.Security.Solutions.entity.Branch;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.ClientCompany;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ClientStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RiskLevel;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.BankDetailsRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.BranchRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientCompanyRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;

@Configuration
public class DataSeeder {

    private static final String AREA_MANAGER_PASSWORD = "area123";

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            BranchRepository branchRepository,
            ClientCompanyRepository clientCompanyRepository,
            ClientRepository clientRepository,
            BankDetailsRepository bankDetailsRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {

                Branch colombo = branchRepository.save(new Branch(null, "Colombo"));
                Branch kandy = branchRepository.save(new Branch(null, "Kandy"));
                Branch kurunegala = branchRepository.save(new Branch(null, "Kurunegala"));
                Branch rathnapura = branchRepository.save(new Branch(null, "Rathnapura"));

                ClientCompany company1 = clientCompanyRepository.save(new ClientCompany(null, "ABC Company", colombo));
                ClientCompany company2 = clientCompanyRepository
                        .save(new ClientCompany(null, "BlueWave Solutions", colombo));
                ClientCompany company3 = clientCompanyRepository
                        .save(new ClientCompany(null, "GreenLeaf Pvt Ltd", kandy));
                ClientCompany company4 = clientCompanyRepository
                        .save(new ClientCompany(null, "NextGen Technologies", kurunegala));
                ClientCompany company5 = clientCompanyRepository
                        .save(new ClientCompany(null, "Sunrise Enterprises", rathnapura));

                // Add operational manager
                User opsManager = new User(null, "ops@ace.com", passwordEncoder.encode("ops123"), "OPERATION_MANAGER");
                opsManager.setFullName("Operational Manager");
                userRepository.save(opsManager);

                // Keep group users as executive officers
                User exec1 = new User(null, "executive@ace.com", passwordEncoder.encode("exec123"),
                        "EXECUTIVE_OFFICER");
                exec1.setFullName("Executive Officer");
                userRepository.save(exec1);

                User chairman = new User(null, "chairman@ace.com", passwordEncoder.encode("chairman123"), "CHAIRMAN");
                chairman.setFullName("Chairman");
                userRepository.save(chairman);

                User director = new User(null, "director@ace.com", passwordEncoder.encode("director123"), "DIRECTOR");
                director.setFullName("Managing Director");
                userRepository.save(director);

                User accountant = new User(null, "accountant@ace.com", passwordEncoder.encode("accountant123"),
                        "ACCOUNTANT");
                accountant.setFullName("Head Accountant");
                userRepository.save(accountant);

                // Existing Area managers
                User am1 = new User(null, "areamanager@ace.com", passwordEncoder.encode(AREA_MANAGER_PASSWORD),
                        "AREA_MANAGER", null, null, colombo);
                am1.setFullName("Area Manager Colombo");
                userRepository.save(am1);

                User am2 = new User(null, "areamanager1@ace.com", passwordEncoder.encode(AREA_MANAGER_PASSWORD),
                        "AREA_MANAGER", null, null, kandy);
                am2.setFullName("Area Manager Kandy");
                userRepository.save(am2);
                userRepository.save(new User(null, "areamanager2@ace.com",
                        passwordEncoder.encode(AREA_MANAGER_PASSWORD), "AREA_MANAGER", null, null, kurunegala));
                userRepository.save(new User(null, "areamanager3@ace.com",
                        passwordEncoder.encode(AREA_MANAGER_PASSWORD), "AREA_MANAGER", null, null, rathnapura));
                userRepository.save(new User(null, "am@ace.com", passwordEncoder.encode("uthu"), "AREA_MANAGER", null,
                        null, colombo));

                System.out.println("Default users, branches, and client companies seeded to database.");
            }

            // ── Guarantee OP003 Operation Manager Exists ──────────────────────────────
            if (userRepository.findByUsername("OP003").isEmpty()) {
                User op003 = new User(null, "op003@ace.com", passwordEncoder.encode("1234567Op@"), "OPERATION_MANAGER");
                op003.setUsername("OP003");
                op003.setFullName("Operational Manager OP003");
                op003.setAdminPosition("Operation Manager");
                userRepository.save(op003);
                System.out.println(" OP003 user seeded to database (Role: OPERATION_MANAGER, Pass: 1234567Op@).");
            }

            // ── Ace Bank Details (used on all invoices) ──────────────────────────────
            if (bankDetailsRepository.count() == 0) {
                BankDetails aceBank = new BankDetails();
                aceBank.setBankName("Bank of Ceylon");
                aceBank.setAccountName("Ace Front Line Security Solutions (PVT) Ltd");
                aceBank.setAccountNumber("79289055");
                aceBank.setBranchName("Lake View Branch");
                aceBank.setBranchCode("612");
                aceBank.setSwiftCode("BCEYLKLX");
                aceBank.setIsActive(true);
                bankDetailsRepository.save(aceBank);
                System.out.println(" Ace bank details seeded (Bank of Ceylon, A/C: 79289055).");
            }

            // ── Test Clients ──────────────────────────────────────────────────────────
            if (clientRepository.count() == 0) {

                // Client 1 — ABC Corporation
                Client client1 = new Client();
                client1.setClientCode("ACE-2024-001");
                client1.setCompanyName("ABC Corporation");
                client1.setCompanyRegistrationNo("ABC-2024-001");
                client1.setVatNumber("VAT-ABC-001");
                client1.setIndustryType("Manufacturing");
                client1.setAddress("123 Business Street, Colombo 03");
                client1.setServiceLocation("123 Business Street, Colombo 03");
                client1.setCity("Colombo");
                client1.setContactPersonName("John Doe");
                client1.setContactPersonDesignation("Finance Manager");
                client1.setContactPersonEmail("john@abc.com");
                client1.setContactPersonPhone("0771234567");
                client1.setUsername("abc_corp");
                client1.setPasswordHash(passwordEncoder.encode("Client123#"));
                client1.setIsFirstLogin(true);
                client1.setServiceStartDate(LocalDate.of(2024, 1, 1));
                client1.setContractDurationMonths(12);
                // Invoice calculation fields — 4-tier strength and rates
                client1.setEntryLevelCount(2);
                client1.setMidLevelCount(4);
                client1.setSpecializedCount(0);
                client1.setSupervisorCount(0);

                client1.setEntryLevelRatePerShift(new BigDecimal("2701.93"));
                client1.setMidLevelRatePerShift(new BigDecimal("2871.93"));
                client1.setSpecializedRatePerShift(BigDecimal.ZERO);
                client1.setSupervisorRatePerShift(BigDecimal.ZERO);

                client1.setEntryLevelOtRatePerHour(new BigDecimal("500.00"));
                client1.setMidLevelOtRatePerHour(new BigDecimal("500.00"));
                client1.setSpecializedOtRatePerHour(BigDecimal.ZERO);
                client1.setSupervisorOtRatePerHour(BigDecimal.ZERO);
                client1.setRiskLevel(RiskLevel.MEDIUM);
                client1.setRecommendedOfficers(6);
                client1.setStatus(ClientStatus.ACTIVE);
                client1.setRegisteredAt(LocalDateTime.now());
                client1.setUpdatedAt(LocalDateTime.now());
                clientRepository.save(client1);

                // Client 2 — XYZ Industries
                Client client2 = new Client();
                client2.setClientCode("ACE-2024-002");
                client2.setCompanyName("XYZ Industries");
                client2.setCompanyRegistrationNo("XYZ-2024-002");
                client2.setVatNumber("VAT-XYZ-002");
                client2.setIndustryType("Retail");
                client2.setAddress("456 Commerce Road, Kandy");
                client2.setServiceLocation("456 Commerce Road, Kandy");
                client2.setCity("Kandy");
                client2.setContactPersonName("Jane Smith");
                client2.setContactPersonDesignation("Operations Director");
                client2.setContactPersonEmail("jane@xyz.com");
                client2.setContactPersonPhone("0777654321");
                client2.setUsername("xyz_industries");
                client2.setPasswordHash(passwordEncoder.encode("Client123#"));
                client2.setIsFirstLogin(true);
                client2.setServiceStartDate(LocalDate.of(2024, 2, 1));
                client2.setContractDurationMonths(24);
                // Invoice calculation fields — 4-tier strength and rates
                client2.setEntryLevelCount(3);
                client2.setMidLevelCount(5);
                client2.setSpecializedCount(0);
                client2.setSupervisorCount(0);

                client2.setEntryLevelRatePerShift(new BigDecimal("2701.93"));
                client2.setMidLevelRatePerShift(new BigDecimal("2871.93"));
                client2.setSpecializedRatePerShift(BigDecimal.ZERO);
                client2.setSupervisorRatePerShift(BigDecimal.ZERO);

                client2.setEntryLevelOtRatePerHour(new BigDecimal("600.00"));
                client2.setMidLevelOtRatePerHour(new BigDecimal("600.00"));
                client2.setSpecializedOtRatePerHour(BigDecimal.ZERO);
                client2.setSupervisorOtRatePerHour(BigDecimal.ZERO);
                client2.setRiskLevel(RiskLevel.HIGH);
                client2.setRecommendedOfficers(8);
                client2.setStatus(ClientStatus.ACTIVE);
                client2.setRegisteredAt(LocalDateTime.now());
                client2.setUpdatedAt(LocalDateTime.now());
                clientRepository.save(client2);

                System.out.println(" Test client accounts created:");
                System.out.println("   - Username: abc_corp     / Password: Client123#");
                System.out.println("   - Username: xyz_industries / Password: Client123#");
            }
        };
    }
}
