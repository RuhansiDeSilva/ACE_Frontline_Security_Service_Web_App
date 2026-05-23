package com.security.Ace.Front.Line.Security.Solutions.scheduler;

import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import com.security.Ace.Front.Line.Security.Solutions.service.EmailService;
import com.security.Ace.Front.Line.Security.Solutions.service.SalaryService;
import com.security.Ace.Front.Line.Security.Solutions.util.PdfGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.mail.MessagingException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Component
public class SalaryEmailScheduler {

    private static final Logger logger = LoggerFactory.getLogger(SalaryEmailScheduler.class);

    private final SalaryService salaryService;
    private final EmailService emailService;
    private final PdfGenerator pdfGenerator;

    public SalaryEmailScheduler(SalaryService salaryService, EmailService emailService, PdfGenerator pdfGenerator) {
        this.salaryService = salaryService;
        this.emailService = emailService;
        this.pdfGenerator = pdfGenerator;
    }

    // Runs at 9:00 AM on the 10th day of every month
    @Scheduled(cron = "0 0 9 10 * ?")
    @Transactional(readOnly = true)
    public void sendMonthlySalaryEmails() {
        // Target the previous month
        String previousMonth = LocalDate.now().minusMonths(1).format(DateTimeFormatter.ofPattern("yyyy-MM"));
        logger.info("Starting scheduled task to send salary emails for month: {}", previousMonth);

        List<Salary> paidSalaries = salaryService.getPaidForMonth(previousMonth);
        if (paidSalaries.isEmpty()) {
            logger.warn("No PAID salaries found for month: {}", previousMonth);
            return;
        }

        String companyName = "Ace Front Line Security Solutions";
        int sentCount = 0;

        for (Salary salary : paidSalaries) {
            String email = salary.getOfficer().getEmail();
            if (email != null && !email.trim().isEmpty()) {
                try {
                    byte[] pdfBytes = pdfGenerator.generatePayslip(salary);
                    emailService.sendSalaryEmail(
                            email,
                            salary.getOfficer().getFullName(),
                            previousMonth,
                            pdfBytes,
                            companyName
                    );
                    sentCount++;
                    logger.info("Sent payslip email to: {}", email);
                } catch (MessagingException e) {
                    logger.error("Failed to send email to {}: {}", email, e.getMessage());
                } catch (Exception e) {
                    logger.error("Error generating or sending PDF for {}: {}", email, e.getMessage());
                }
            } else {
                logger.warn("No email address found for officer ID: {}", salary.getOfficer().getId());
            }
        }

        logger.info("Finished sending {} salary emails for month: {}", sentCount, previousMonth);
    }
}
