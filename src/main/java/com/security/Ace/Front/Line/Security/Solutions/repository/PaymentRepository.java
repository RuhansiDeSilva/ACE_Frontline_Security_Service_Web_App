package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Payment;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    List<Payment> findByInvoiceInvoiceIdOrderByPaymentDateDesc(Integer invoiceId);

    List<Payment> findByClientClientIdOrderByPaymentDateDesc(Integer clientId);

    List<Payment> findByVerificationStatusOrderByProofUploadedAtDesc(VerificationStatus status);

    // All payments awaiting accountant verification
    @Query("SELECT p FROM Payment p WHERE p.verificationStatus = 'PENDING' ORDER BY p.proofUploadedAt ASC")
    List<Payment> findPaymentsPendingVerification();

    List<Payment> findByInvoiceInvoiceIdAndVerificationStatus(Integer invoiceId, VerificationStatus status);

    // Total verified (paid) amount for an invoice
    @Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM Payment p " +
            "WHERE p.invoice.invoiceId = :invoiceId AND p.verificationStatus = 'VERIFIED'")
    Double getTotalVerifiedAmountForInvoice(@Param("invoiceId") Integer invoiceId);

    List<Payment> findByTransactionReference(String transactionReference);

    @Query("SELECT p FROM Payment p WHERE p.client.clientId = :clientId " +
            "AND p.verificationStatus = 'REJECTED' ORDER BY p.verifiedAt DESC")
    List<Payment> findRejectedPaymentsByClient(@Param("clientId") Integer clientId);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.verificationStatus = 'PENDING'")
    long countPendingVerifications();

    @Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM Payment p " +
            "WHERE p.verificationStatus = 'VERIFIED' AND DATE(p.verifiedAt) = CURRENT_DATE")
    Double getTotalPaymentsVerifiedToday();

    // Payments for ledger — filtered by client, month, year, status (all optional via native query)
    @Query(value = "SELECT p.* FROM payments p " +
            "JOIN invoices i ON p.invoice_id = i.invoice_id " +
            "WHERE (:clientId IS NULL OR p.client_id = :clientId) " +
            "AND (:month IS NULL OR MONTH(p.payment_date) = :month) " +
            "AND (:year IS NULL OR YEAR(p.payment_date) = :year) " +
            "AND (:status IS NULL OR p.verification_status = :status) " +
            "ORDER BY p.payment_date DESC",
            nativeQuery = true)
    List<Payment> findForLedger(@Param("clientId") Integer clientId,
                                @Param("month") Integer month,
                                @Param("year") Integer year,
                                @Param("status") String status);

    // Overdue payments — linked to OVERDUE invoices
    @Query("SELECT p FROM Payment p WHERE p.invoice.status = 'OVERDUE' " +
            "ORDER BY p.invoice.dueDate ASC")
    List<Payment> findOverduePayments();

    // Average days between invoice issued and payment verified (for analytics)
    @Query(value = "SELECT AVG(DATEDIFF(p.verified_at, i.issued_at)) " +
            "FROM payments p JOIN invoices i ON p.invoice_id = i.invoice_id " +
            "WHERE p.verification_status = 'VERIFIED' AND p.verified_at IS NOT NULL",
            nativeQuery = true)
    Double getAveragePaymentTimeDays();
}