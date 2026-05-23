package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.LoanDeduction;
import com.security.Ace.Front.Line.Security.Solutions.entity.LoanRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ADMIN FINANCE
 */
@Repository
public interface LoanDeductionRepository extends JpaRepository<LoanDeduction, Long> {

    List<LoanDeduction> findByLoanRequest(LoanRequest loanRequest);

    List<LoanDeduction> findByLoanRequestId(Long loanRequestId);

    List<LoanDeduction> findByUser(User user);

    List<LoanDeduction> findByUserAndStatus(User user, String status);

    List<LoanDeduction> findByStatus(String status);

    List<LoanDeduction> findByDeductionMonthAndStatus(String deductionMonth, String status);

    List<LoanDeduction> findByDeductionMonth(String deductionMonth);

    List<LoanDeduction> findByUserAndDeductionMonth(User user, String deductionMonth);

    /** Sum of pending deductions for a user in a given month */
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM LoanDeduction d WHERE d.user = :user AND d.deductionMonth = :month AND d.status = 'PENDING'")
    Double sumPendingDeductionsForUserAndMonth(@Param("user") User user, @Param("month") String month);

    /** Sum of all pending deductions for a specific loan */
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM LoanDeduction d WHERE d.loanRequest = :loan AND d.status = 'PENDING'")
    Double sumPendingForLoan(@Param("loan") LoanRequest loan);

    boolean existsByLoanRequest(LoanRequest loanRequest);

    /** Count deductions by status for a specific loan */
    long countByLoanRequestAndStatus(LoanRequest loanRequest, String status);

    /** Count all deductions by status */
    long countByStatus(String status);

    /** Sum of all deduction amounts by status */
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM LoanDeduction d WHERE d.status = :status")
    Double sumAmountByStatus(@Param("status") String status);

    /** Delete all deductions for a specific loan (cleanup after completion) */
    void deleteByLoanRequest(LoanRequest loanRequest);
}
