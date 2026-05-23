package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ClientStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {

        // ── Basic lookups ────────────────────────────────────────────────────────

        Optional<Client> findByUsername(String username);

        Optional<Client> findByCompanyName(String companyName);

        Optional<Client> findByCompanyNameIgnoreCase(String companyName);

        boolean existsByUsername(String username);

        boolean existsByContactPersonEmail(String email);

        boolean existsByCompanyRegistrationNo(String registrationNo);

        @Query("SELECT MAX(c.clientCode) FROM Client c WHERE c.clientCode LIKE :prefix")
        String findMaxClientCodeByPrefix(@Param("prefix") String prefix);

        // ── Status-based queries ─────────────────────────────────────────────────

        List<Client> findByStatus(ClientStatus status);

        List<Client> findByStatusOrderByCompanyNameAsc(ClientStatus status);

        List<Client> findByCityIgnoreCaseAndStatusOrderByCompanyNameAsc(String city, ClientStatus status);

        @Query("SELECT COUNT(c) FROM Client c WHERE c.status = 'ACTIVE'")
        long countActiveClients();

        // ── Count by status (string param) ───────────────────────────────────────

        @Query("SELECT COUNT(c) FROM Client c WHERE c.status = :status")
        long countByStatus(@Param("status") String status);

        // ── New clients registered in a specific month/year ───────────────────────
        //
        // Used by admin analytics dashboard:
        // clientRepository.countNewClientsInMonth(month, year)
        //
        @Query(value = """
                        SELECT COUNT(*) FROM clients
                        WHERE MONTH(registered_at) = :month
                          AND YEAR(registered_at)  = :year
                        """, nativeQuery = true)
        long countNewClientsInMonth(@Param("month") int month,
                        @Param("year") int year);

        // ── Recently registered (last 30 days) ───────────────────────────────────

        @Query(value = "SELECT * FROM clients WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY registered_at DESC", nativeQuery = true)
        List<Client> findRecentlyRegistered();

        // ── Search ───────────────────────────────────────────────────────────────

        @Query("SELECT c FROM Client c WHERE "
                        + "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) "
                        + "OR LOWER(c.city) LIKE LOWER(CONCAT('%', :keyword, '%'))")
        List<Client> searchClients(@Param("keyword") String keyword);

        // ── Contract expiry by exact threshold date ───────────────────────────────

        @Query(value = """
                        SELECT * FROM clients
                        WHERE status = 'ACTIVE'
                          AND DATE_ADD(service_start_date,
                                  INTERVAL contract_duration_months MONTH)
                              BETWEEN CURDATE() AND :expiryThreshold
                        ORDER BY DATE_ADD(service_start_date,
                                  INTERVAL contract_duration_months MONTH) ASC
                        """, nativeQuery = true)
        List<Client> findClientsExpiringSoon(@Param("expiryThreshold") LocalDate expiryThreshold);

        // ── Contract expiry by number of days ahead ───────────────────────────────

        @Query(value = """
                        SELECT * FROM clients
                        WHERE status = 'ACTIVE'
                          AND DATE_ADD(service_start_date,
                                  INTERVAL contract_duration_months MONTH)
                              BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :daysAhead DAY)
                        ORDER BY DATE_ADD(service_start_date,
                                  INTERVAL contract_duration_months MONTH) ASC
                        """, nativeQuery = true)
        List<Client> findClientsExpiringSoonNative(@Param("daysAhead") int daysAhead);

        // ── Already-expired active contracts ─────────────────────────────────────

        @Query(value = """
                        SELECT * FROM clients
                        WHERE status = 'ACTIVE'
                          AND DATE_ADD(service_start_date,
                                  INTERVAL contract_duration_months MONTH) < CURDATE()
                        """, nativeQuery = true)
        List<Client> findContractsAlreadyExpired();

        // ── Clients by risk level ─────────────────────────────────────────────────

        @Query("SELECT c FROM Client c WHERE c.riskLevel = :riskLevel AND c.status = 'ACTIVE'")
        List<Client> findByRiskLevel(@Param("riskLevel") String riskLevel);

        // ── Top clients by total invoiced revenue ─────────────────────────────────
        //
        // Used by admin analytics dashboard top-5 clients widget.
        //
        @Query(value = """
                        SELECT c.* FROM clients c
                        JOIN invoices i ON i.client_id = c.client_id
                        WHERE i.status != 'CANCELLED'
                        GROUP BY c.client_id
                        ORDER BY SUM(i.total_amount) DESC
                        LIMIT :limit
                        """, nativeQuery = true)
        List<Client> findTopClientsByRevenue(@Param("limit") int limit);
}