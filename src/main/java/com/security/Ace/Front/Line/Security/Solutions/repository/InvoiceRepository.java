package com.security.Ace.Front.Line.Security.Solutions.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceType;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {

        Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

        List<Invoice> findByClientClientIdOrderByIssueDateDesc(Integer clientId);

        // Client-facing list should not include pre-issue states
        @Query("SELECT i FROM Invoice i WHERE i.client.clientId = :clientId " +
                        "AND i.status NOT IN ('DRAFT') " +
                        "ORDER BY i.issueDate DESC")
        List<Invoice> findClientVisibleInvoices(@Param("clientId") Integer clientId);

        List<Invoice> findByStatus(InvoiceStatus status);

        List<Invoice> findByStatusOrderByCreatedAtDesc(InvoiceStatus status);

        List<Invoice> findByClientClientIdAndStatus(Integer clientId, InvoiceStatus status);

        List<Invoice> findByBillingMonthAndBillingYear(Integer month, Integer year);

        List<Invoice> findByInvoiceType(InvoiceType invoiceType);

        boolean existsByClientClientIdAndBillingMonthAndBillingYear(
                        Integer clientId, Integer month, Integer year);

        // Pending invoices for a client — ISSUED or PAYMENT_UPLOADED or
        // PAYMENT_REJECTED
        @Query("SELECT i FROM Invoice i WHERE i.client.clientId = :clientId " +
                        "AND i.status IN ('ISSUED', 'PAYMENT_UPLOADED', 'PAYMENT_REJECTED') " +
                        "ORDER BY i.issueDate DESC")
        List<Invoice> findPendingInvoicesByClient(@Param("clientId") Integer clientId);

        // Overdue invoices — ISSUED past due date, or PAYMENT_UPLOADED/REJECTED past
        // grace period
        @Query("SELECT i FROM Invoice i WHERE i.status IN ('ISSUED', 'PAYMENT_UPLOADED', 'PAYMENT_REJECTED', 'OVERDUE') "
                        +
                        "AND i.dueDate < CURRENT_DATE")
        List<Invoice> findOverdueInvoices();

        @Query("SELECT i FROM Invoice i WHERE i.client.clientId = :clientId " +
                        "AND i.status IN ('ISSUED', 'PAYMENT_UPLOADED', 'PAYMENT_REJECTED', 'OVERDUE') " +
                        "AND i.dueDate < CURRENT_DATE")
        List<Invoice> findOverdueInvoicesByClient(@Param("clientId") Integer clientId);

        // All DRAFT invoices — for accountant smart-review queue
        @Query("SELECT i FROM Invoice i WHERE i.status = 'DRAFT' ORDER BY i.createdAt ASC")
        List<Invoice> findAllDraftInvoices();

        // Invoices with payment proof awaiting verification
        @Query("SELECT i FROM Invoice i WHERE i.status = 'PAYMENT_UPLOADED' ORDER BY i.issuedAt DESC")
        List<Invoice> findInvoicesPendingVerification();

        // Invoices that are ISSUED and due today (for reminders)
        @Query(value = "SELECT * FROM invoices WHERE status = 'ISSUED' AND due_date = CURDATE()", nativeQuery = true)
        List<Invoice> findInvoicesDueToday();

        // Invoices eligible for proactive payment reminders
        @Query("""
                        SELECT i FROM Invoice i
                        WHERE i.status IN ('ISSUED', 'PAYMENT_REJECTED')
                                AND i.balanceAmount > 0
                                AND i.dueDate BETWEEN :fromDate AND :toDate
                        """)
        List<Invoice> findInvoicesForReminderWindow(@Param("fromDate") LocalDate fromDate,
                        @Param("toDate") LocalDate toDate);

        // Invoices past grace period (20th) — for automatic late fee application
        @Query(value = "SELECT * FROM invoices WHERE status IN ('ISSUED','PAYMENT_UPLOADED','PAYMENT_REJECTED') " +
                        "AND due_date < DATE_SUB(CURDATE(), INTERVAL 5 DAY) " +
                        "AND late_fee_applied = false", nativeQuery = true)
        List<Invoice> findInvoicesEligibleForLateFee();

        @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
                        "WHERE i.billingMonth = :month AND i.billingYear = :year AND i.status != 'CANCELLED'")
        Double getTotalInvoicedAmountForMonth(@Param("month") Integer month, @Param("year") Integer year);

        @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
                        "WHERE i.billingMonth = :month AND i.billingYear = :year AND i.status = 'PAID'")
        Double getTotalCollectedAmountForMonth(@Param("month") Integer month, @Param("year") Integer year);

        // Total outstanding = all ISSUED + PAYMENT_UPLOADED + PAYMENT_REJECTED +
        // OVERDUE
        @Query("SELECT COALESCE(SUM(i.balanceAmount), 0) FROM Invoice i " +
                        "WHERE i.status IN ('ISSUED', 'PAYMENT_UPLOADED', 'PAYMENT_REJECTED', 'OVERDUE')")
        Double getTotalOutstandingAmount();

        // Total late fees currently accrued
        @Query("SELECT COALESCE(SUM(i.lateFee), 0) FROM Invoice i WHERE i.lateFeeApplied = true")
        Double getTotalLateFees();

        // Count invoices for this month
        @Query("SELECT COUNT(i) FROM Invoice i WHERE i.billingMonth = :month AND i.billingYear = :year")
        long countInvoicesForMonth(@Param("month") Integer month, @Param("year") Integer year);

        @Query("SELECT MAX(i.invoiceNumber) FROM Invoice i WHERE i.invoiceNumber LIKE :prefix")
        String findMaxInvoiceNumberByPrefix(@Param("prefix") String prefix);

        // Full invoice history for a client (all statuses, all time)
        @Query("SELECT i FROM Invoice i WHERE i.client.clientId = :clientId ORDER BY i.issueDate DESC")
        List<Invoice> findClientInvoiceHistory(@Param("clientId") Integer clientId);
}