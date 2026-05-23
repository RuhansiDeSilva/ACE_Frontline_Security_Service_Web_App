package com.security.Ace.Front.Line.Security.Solutions.service;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.EmailLog;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.EmailType;
import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.entity.Payment;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.EmailStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.EmailLogRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.EmailSendingException;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;

@Service
@RequiredArgsConstructor
public class EmailService {
        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmailService.class);

        private final EmailLogRepository emailLogRepository;
        private final JavaMailSender mailSender;

        @Value("${spring.mail.username}")
        private String fromEmail;

        private static final String FROM_NAME = "Ace Front Line Security";
        private static final String LOGO_CID = "afls-logo";

        @Value("${app.brand.logo-path:frontend/public/logo.png}")
        private String brandLogoPath;

        @Value("${app.portal.url:http://localhost:5173}")
        private String portalUrl;

        private String getAbsoluteLogoPath() {
                if (brandLogoPath == null || brandLogoPath.isBlank())
                        return null;
                File file = new File(brandLogoPath);
                if (file.isAbsolute())
                        return brandLogoPath;
                return new File(System.getProperty("user.dir"), brandLogoPath).getAbsolutePath();
        }

        private boolean hasBrandLogo() {
                String path = getAbsoluteLogoPath();
                return path != null && new File(path).exists();
        }

        // ═════════════════════════════════════════════════════════════════════════
        // HR & APPLICANT EMAIL METHODS
        // ═════════════════════════════════════════════════════════════════════════

        public void sendInterviewInvitationEmail(String toEmail, String applicantName, String jobTitle,
                        String interviewDate, String interviewTime, String interviewLocation) {
                try {
                        MimeMessage message = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(message, true);
                        helper.setFrom(fromEmail);
                        helper.setTo(toEmail);
                        helper.setSubject("Interview Invitation - " + jobTitle);
                        String htmlContent = "<h3>Dear " + applicantName + ",</h3>"
                                        + "<p>Congratulations! We are pleased to invite you for an interview for the position of "
                                        + jobTitle + ".</p>"
                                        + "<p><b>Interview Date:</b> " + interviewDate + "</p>"
                                        + "<p><b>Interview Time:</b> " + interviewTime + "</p>"
                                        + "<p><b>Interview Location:</b> " + interviewLocation + "</p>"
                                        + "<p>Please confirm your attendance by replying to this email.</p>"
                                        + "<p>We look forward to meeting you!</p>"
                                        + "<p>Best regards,<br/>Ace Front Line Security Solutions<br/>Operational Management Team</p>";
                        helper.setText(htmlContent, true);
                        mailSender.send(message);
                } catch (MessagingException e) {
                        throw new EmailSendingException("Failed to send interview invitation email", e);
                }
        }

        public void sendRiskAssessmentEmail(String recipientEmail, String companyName, byte[] pdfContent) {
                try {
                        MimeMessage message = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(message, true);
                        helper.setFrom(fromEmail);
                        helper.setTo(recipientEmail);
                        helper.setSubject("AI Security Risk Assessment Report - " + companyName);

                        String htmlContent = "<div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>"
                                        + "<h2 style='color: #1a1a1b;'>Security Risk Assessment Report</h2>"
                                        + "<p>Dear Team,</p>"
                                        + "<p>Thank you for using the Ace Front Line Security AI Risk Assessment tool. "
                                        + "Based on the site profile provided for <strong>" + companyName
                                        + "</strong>, "
                                        + "we have generated a preliminary security risk analysis.</p>"
                                        + "<p>Please find the detailed assessment report attached to this email.</p>"
                                        + "<p>Our assessment includes:</p>"
                                        + "<ul>"
                                        + "<li>Your company's security risk level</li>"
                                        + "<li>Recommended security officer staffing</li>"
                                        + "<li>Site profile summary</li>"
                                        + "</ul>"
                                        + "<p>If you have any questions or would like to schedule a comprehensive on-site security survey, "
                                        + "please don't hesitate to contact our operations team at <strong>0114848177</strong>.</p>"
                                        + "<br/>"
                                        + "<p>Best regards,<br/>"
                                        + "<strong>Ace Front Line Security Solutions</strong><br/>"
                                        + "Strategic Protection Team</p>"
                                        + "</div>";

                        helper.setText(htmlContent, true);
                        helper.addAttachment("AI_Risk_Assessment_" + companyName.replaceAll("\\s+", "_") + ".pdf",
                                        new ByteArrayResource(pdfContent));

                        mailSender.send(message);
                        log.info("AI Risk Assessment email sent successfully to {}", recipientEmail);

                        // Log the email in our system
                        EmailLog logEntry = new EmailLog();
                        logEntry.setRecipientEmail(recipientEmail);
                        logEntry.setSubject(helper.getMimeMessage().getSubject());
                        logEntry.setEmailType(EmailType.AI_RISK_ASSESSMENT);
                        logEntry.setSentAt(LocalDateTime.now());
                        logEntry.setStatus(EmailStatus.SENT);
                        emailLogRepository.save(logEntry);

                } catch (Exception e) {
                        log.error("Failed to send AI Risk Assessment email: {}", e.getMessage());
                        throw new EmailSendingException("Failed to send AI Risk Assessment email", e);
                }
        }

        public void sendRejectionEmail(String toEmail, String applicantName, String jobTitle) {
                try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setFrom(fromEmail);
                        message.setTo(toEmail);
                        message.setSubject("Application Status - " + jobTitle);
                        message.setText("Dear " + applicantName + ",\n\n"
                                        + "Thank you for your interest in the position of " + jobTitle + ".\n\n"
                                        + "After careful consideration, we regret to inform you that we have decided to proceed with other candidates whose qualifications more closely match our requirements.\n\n"
                                        + "We appreciate your interest and encourage you to apply for future opportunities.\n\n"
                                        + "Best regards,\nAce Front Line Security Solutions\nOperational Management Team");
                        mailSender.send(message);
                } catch (MailException e) {
                        throw new EmailSendingException("Failed to send rejection email", e);
                }
        }

        public void sendSelectionEmail(String toEmail, String applicantName, String jobTitle, String reportDate,
                        String description) {
                try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setFrom(fromEmail);
                        message.setTo(toEmail);
                        message.setSubject("Congratulations! You Have Been Selected - " + jobTitle);
                        String text = "Dear " + applicantName + ",\n\n"
                                        + "We are delighted to inform you that you have been selected for the position of "
                                        + jobTitle + " at Ace Front Line Security Solutions.\n\n";
                        if (reportDate != null && !reportDate.isEmpty()) {
                                text += "Please report on: " + reportDate + "\n\n";
                        }
                        if (description != null && !description.trim().isEmpty()) {
                                text += "Additional Information:\n" + description + "\n\n";
                        }
                        text += "Please bring the following documents when you report:\n"
                                        + "- National Identity Card (Original & Copy)\n"
                                        + "- Educational Certificates (Originals & Copies)\n"
                                        + "- Two Passport-Size Photographs\n\n"
                                        + "If you have any questions, please contact us at 0114848177 / 0112867359.\n\n"
                                        + "We look forward to welcoming you to our team!\n\n"
                                        + "Best regards,\nAce Front Line Security Solutions\nOperational Management Team";
                        message.setText(text);
                        mailSender.send(message);
                } catch (MailException e) {
                        throw new EmailSendingException("Failed to send selection email", e);
                }
        }

        public void sendInquiryReplyEmail(String toEmail, String inquirerName, String originalSubject,
                        String replyBody) {
                try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setFrom(fromEmail);
                        message.setTo(toEmail);
                        message.setSubject("Re: " + originalSubject + " - Ace Front Line Security Solutions");
                        message.setText("Dear " + inquirerName + ",\n\n"
                                        + "Thank you for reaching out to us regarding: " + originalSubject + "\n\n"
                                        + "--- Our Response ---\n"
                                        + replyBody + "\n\n"
                                        + "If you have any further questions, please don't hesitate to contact us.\n\n"
                                        + "Best regards,\nAce Front Line Security Solutions\nOperational Management Team\nPhone: 0114848177 / 0112867359");
                        mailSender.send(message);
                } catch (MailException e) {
                        throw new EmailSendingException("Failed to send inquiry reply email", e);
                }
        }

        public void sendSimpleEmail(String to, String subject, String text) {
                try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setFrom(fromEmail);
                        message.setTo(to);
                        message.setSubject(subject);
                        message.setText(text);
                        mailSender.send(message);
                } catch (MailException e) {
                        throw new EmailSendingException("Failed to send simple email", e);
                }
        }

        // ═════════════════════════════════════════════════════════════════════════
        // CLIENT & FINANCIAL EMAIL METHODS
        // ═════════════════════════════════════════════════════════════════════════

        @Transactional
        public void sendCredentialsEmail(Client client, String password) {
                String subject = "Your Ace Front Line Security Portal — Login Credentials";
                String body = buildClientHeader()
                                + sectionTitle("Welcome to Ace Front Line Security Solutions")
                                + para("Hello <strong>" + esc(client.getCompanyName()) + "</strong>,")
                                + para("Your client account has been successfully provisioned. You now have secure access to real-time reporting, "
                                                + "scheduling, and security management tools.")
                                + card(
                                                row("Company", esc(client.getCompanyName()))
                                                                + row("Username", code(esc(client.getUsername())))
                                                                + row("Temporary Password", code(esc(password))))
                                + warn("Please log in and change your password immediately for security. "
                                                + "Temporary credentials expire within 24 hours.")
                                + cta("Login to Client Portal", portal("/client-login"))
                                + buildClientFooter();

                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.CREDENTIALS, client.getClientId());
        }

        @Transactional
        public void sendClientPasswordResetEmail(Client client, String temporaryPassword) {
                String subject = "Password Reset — Temporary Client Portal Credentials";
                String body = buildHeader()
                                + sectionTitle("Password Reset Requested")
                                + para("Hello <strong>" + esc(client.getCompanyName()) + "</strong>,")
                                + para("A password reset request was received for your client portal account. "
                                                + "Use the temporary credentials below to sign in.")
                                + card(
                                                row("Company", esc(client.getCompanyName()))
                                                                + row("Username", code(esc(client.getUsername())))
                                                                + row("Temporary Password",
                                                                                code(esc(temporaryPassword))))
                                + warn("For security, you must change this temporary password immediately after login.")
                                + cta("Login to Client Portal", portal("/client-login"))
                                + buildFooter();

                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.CREDENTIALS, client.getClientId());
        }

        @Transactional
        public void sendInvoiceEmail(Client client, Invoice invoice, byte[] pdfContent) {
                String subject = "Invoice " + invoice.getInvoiceNumber() + " Issued — Ace Front Line Security";
                String body = buildClientHeader()
                                + sectionTitle("New Invoice Issued")
                                + para("Dear <strong>" + esc(client.getCompanyName())
                                                + "</strong>, a new invoice has been issued to your account. "
                                                + "Please review the details below and arrange payment before the due date.")
                                + card(
                                                row("Invoice Number", esc(invoice.getInvoiceNumber()))
                                                                + row("Billing Period",
                                                                                invoice.getPeriodFrom() + " to "
                                                                                                + invoice.getPeriodTo())
                                                                + row("Invoice Amount", "Rs. "
                                                                                + fmt(invoice.getInvoiceAmount()))
                                                                + row("SSCL (2.5%)",
                                                                                "Rs. " + fmt(invoice.getSsclAmount()))
                                                                + row("VAT", "Rs. " + fmt(invoice.getVatAmount()))
                                                                + rowBold("Total Payable",
                                                                                "Rs. " + fmt(invoice.getTotalAmount()))
                                                                + row("Payment Due Date", invoice.getDueDate() != null
                                                                                ? invoice.getDueDate().toString()
                                                                                : "\u2014"))
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                                + "style='background:#fefce8;border:1px solid #fde047;border-radius:10px;margin:16px 0 24px;'>"
                                + "<tr><td style='padding:18px 24px;font-family:Arial,sans-serif;'>"
                                + "<p style='margin:0 0 8px;color:#854d0e;font-weight:800;font-size:13px;'>&#127968; Payment Instructions</p>"
                                + "<p style='margin:0;color:#78350f;font-size:13px;line-height:1.7;'>"
                                + "Bank: <strong>Bank of Ceylon</strong> &nbsp;|&nbsp; Branch: <strong>Lake View Branch (612)</strong><br>"
                                + "Account No: <strong>79289055</strong><br>"
                                + "Cheque payable to: <strong>Ace Front Line Security Solutions (PVT) Ltd</strong><br>"
                                + "Reference: <strong>" + esc(invoice.getInvoiceNumber()) + "</strong>"
                                + "</p></td></tr></table>"
                                + cta("View Invoice &amp; Upload Payment Proof", portal("/client/payments"))
                                + buildClientFooter();

                String fileName = "Invoice_" + invoice.getInvoiceNumber().replace("/", "_") + ".pdf";
                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.INVOICE_ISSUED, invoice.getInvoiceId(), pdfContent, fileName);
        }

        @Transactional
        public void sendPaymentReminderEmail(Client client, Invoice invoice, int daysRemaining) {
                boolean urgent = daysRemaining <= 1;
                String subject = urgent
                                ? "⚠ Payment Due Tomorrow — " + invoice.getInvoiceNumber()
                                : "Payment Reminder — " + daysRemaining + " Days Remaining — "
                                                + invoice.getInvoiceNumber();

                String urgentBanner = urgent
                                ? "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                                                + "style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:16px;'>"
                                                + "<tr><td style='padding:14px 18px;font-family:Arial,sans-serif;color:#dc2626;font-weight:800;font-size:14px;'>"
                                                + "&#9888; Payment is due tomorrow! Please upload your payment proof today."
                                                + "</td></tr></table>"
                                : "";

                String body = buildHeader()
                                + sectionTitle("Payment Reminder")
                                + para("Dear <strong>" + esc(client.getCompanyName())
                                                + "</strong>, this is a reminder that payment for invoice "
                                                + "<strong>" + esc(invoice.getInvoiceNumber()) + "</strong> is due in "
                                                + "<strong>" + daysRemaining + " day(s)</strong>.")
                                + urgentBanner
                                + card(
                                                row("Invoice Number", esc(invoice.getInvoiceNumber()))
                                                                + rowBold("Amount Due", "Rs. "
                                                                                + fmt(invoice.getBalanceAmount()))
                                                                + row("Due Date",
                                                                                invoice.getDueDate() != null ? invoice
                                                                                                .getDueDate().toString()
                                                                                                : "\u2014"))
                                + para("Pay via bank transfer: <strong>Bank of Ceylon</strong>, A/C: <strong>79289055</strong>, Lake View Branch (612)<br>"
                                                + "Reference: <strong>" + esc(invoice.getInvoiceNumber()) + "</strong>")
                                + cta("Upload Payment Proof", portal("/client/payments"))
                                + buildFooter();

                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.PAYMENT_REMINDER, invoice.getInvoiceId());
        }

        @Transactional
        public void sendOverdueNoticeEmail(Client client, Invoice invoice) {
                String subject = "OVERDUE: Invoice " + invoice.getInvoiceNumber()
                                + " — Late Fee of 1.5% Applied";

                String body = buildHeader()
                                + sectionTitle("Invoice Overdue &#8212; Immediate Action Required")
                                + para("Dear <strong>" + esc(client.getCompanyName())
                                                + "</strong>, your invoice <strong>"
                                                + esc(invoice.getInvoiceNumber())
                                                + "</strong> is overdue. The 5-day grace period has passed and a late fee of "
                                                + "<strong>1.5%</strong> has been applied to your outstanding balance.")
                                + cardRed(
                                                row("Invoice Number", esc(invoice.getInvoiceNumber()))
                                                                + row("Original Amount",
                                                                                "Rs. " + fmt(invoice.getTotalAmount()))
                                                                + row("Late Fee (1.5%)",
                                                                                "Rs. " + fmt(invoice.getLateFee()))
                                                                + rowBold("Total Now Owed", "Rs. "
                                                                                + fmt(invoice.getBalanceAmount())))
                                + para("Please settle this amount immediately to avoid further late fees. "
                                                + "A second 1.5% charge will be applied if still unpaid after 30 days.")
                                + para("If you believe this is in error or wish to discuss a payment plan, "
                                                + "please contact us immediately at <strong>0114848177</strong> or "
                                                + "<a href='mailto:" + fromEmail + "' style='color:#EAB308;'>"
                                                + fromEmail + "</a>.")
                                + cta("Pay Now", portal("/client/payments"))
                                + buildFooter();

                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.OVERDUE_NOTICE, invoice.getInvoiceId());
        }

        @Transactional
        public void sendPaymentVerifiedEmail(Client client, Payment payment, byte[] pdfContent) {
                String subject = "✓ Payment Confirmed — Ace Front Line Security";

                String body = buildHeader()
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:16px;'>"
                                + "<tr><td align='center' style='padding-bottom:20px;'>"
                                + "<div style='width:72px;height:72px;background:#dcfce7;border-radius:50%;"
                                + "display:inline-block;text-align:center;line-height:72px;font-size:36px;'>&#10003;</div>"
                                + "</td></tr></table>"
                                + sectionTitle("Payment Verified!")
                                + para("Dear <strong>" + esc(client.getCompanyName())
                                                + "</strong>, your payment has been successfully verified by our accounts team. Thank you for your prompt payment.")
                                + cardGreen(
                                                row("Invoice", esc(payment.getInvoice().getInvoiceNumber()))
                                                                + row("Amount Paid",
                                                                                "Rs. " + fmt(payment.getAmountPaid()))
                                                                + row("Payment Date",
                                                                                payment.getPaymentDate().toString())
                                                                + row("Method", payment.getPaymentMethod().toString()
                                                                                .replace("_", " "))
                                                                + row("Reference", payment
                                                                                .getTransactionReference() != null
                                                                                                ? esc(payment.getTransactionReference())
                                                                                                : "N/A")
                                                                + row("Verified On", payment.getVerifiedAt() != null
                                                                                ? payment.getVerifiedAt().toLocalDate()
                                                                                                .toString()
                                                                                : "\u2014"))
                                + cta("View Payment History", portal("/client/payments"))
                                + buildFooter();

                String fileName = "Payment_Receipt_" + payment.getInvoice().getInvoiceNumber().replace("/", "_")
                                + ".pdf";
                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.PAYMENT_VERIFIED, payment.getPaymentId(), pdfContent,
                                fileName);
        }

        @Transactional
        public void sendPaymentRejectedEmail(Client client, Payment payment) {
                String subject = "⚠ Payment Proof Rejected — Re-upload Required";

                String body = buildHeader()
                                + sectionTitle("Payment Proof Rejected")
                                + para("Dear <strong>" + esc(client.getCompanyName())
                                                + "</strong>, your payment proof for invoice <strong>"
                                                + esc(payment.getInvoice().getInvoiceNumber())
                                                + "</strong> has been reviewed and could not be accepted.")
                                + cardRed(
                                                row("Invoice", esc(payment.getInvoice().getInvoiceNumber()))
                                                                + row("Amount", "Rs. " + fmt(payment.getAmountPaid()))
                                                                + row("Rejection Reason",
                                                                                "<span style='color:#dc2626;'>" + esc(
                                                                                                payment.getRejectionReason() != null
                                                                                                                ? payment.getRejectionReason()
                                                                                                                : "Not specified")
                                                                                                + "</span>"))
                                + para("<strong>What to do next:</strong>")
                                + "<ol style='font-family:Arial,sans-serif;font-size:14px;color:#4b5563;line-height:1.8;padding-left:20px;margin:8px 0 24px;'>"
                                + "<li>Log in to the client portal</li>"
                                + "<li>Navigate to <strong>Invoices &amp; Payments</strong></li>"
                                + "<li>Upload a valid payment proof (JPG, PNG, or PDF)</li>"
                                + "<li>Ensure the document clearly shows: bank name, amount, date, and transaction reference</li>"
                                + "</ol>"
                                + para("If you need assistance, please contact us at "
                                                + "<a href='mailto:" + fromEmail + "' style='color:#EAB308;'>"
                                                + fromEmail + "</a> or call <strong>0114848177</strong>.")
                                + cta("Re-upload Payment Proof", portal("/client/payments"))
                                + buildFooter();

                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.PAYMENT_REJECTED, payment.getPaymentId());
        }

        @Transactional
        public void sendFeedbackApprovedEmail(Client client) {
                String subject = "Your Testimonial is Now Published — Thank You!";

                String body = buildHeader()
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:16px;'>"
                                + "<tr><td align='center' style='padding-bottom:16px;'>"
                                + "<div style='font-size:52px;'>&#11088;</div>"
                                + "</td></tr></table>"
                                + sectionTitle("Your Feedback Has Been Published!")
                                + para("Dear <strong>" + esc(client.getCompanyName())
                                                + "</strong>, thank you for taking the time to share your experience with us.")
                                + para("Your testimonial is now <strong>live on our homepage</strong>. We truly value your feedback — it helps us continuously improve our services and motivates our team.")
                                + cta("View Our Homepage", portal(""))
                                + buildFooter();

                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.FEEDBACK_APPROVED, client.getClientId());
        }

        @Transactional
        public void sendContractRenewalEmail(Client client, long daysToExpiry) {
                boolean urgent = daysToExpiry <= 7;
                String subject = urgent
                                ? "🚨 URGENT: Your Contract Expires in " + daysToExpiry + " Days"
                                : "Contract Renewal Reminder — " + daysToExpiry + " Days to Expiry";

                String badgeColor = urgent ? "#dc2626" : daysToExpiry <= 30 ? "#f59e0b" : "#3b82f6";
                String badgeText = urgent ? "URGENT" : daysToExpiry <= 30 ? "ACTION REQUIRED" : "REMINDER";

                String expiryDate = client.getContractEndDate() != null
                                ? client.getContractEndDate().toString()
                                : "—";

                String body = buildHeader()
                                + "<table role='presentation' cellpadding='0' cellspacing='0' style='margin-bottom:16px;'>"
                                + "<tr><td style='background:" + badgeColor + ";color:#fff;padding:5px 14px;"
                                + "border-radius:4px;font-family:Arial,sans-serif;font-size:11px;font-weight:800;"
                                + "letter-spacing:1px;'>" + badgeText + "</td></tr></table>"
                                + sectionTitle("Contract Renewal Reminder")
                                + para("Dear <strong>" + esc(client.getCompanyName())
                                                + "</strong>, your security service contract with Ace Front Line Security Solutions is due to expire in "
                                                + "<strong>" + daysToExpiry + " day(s)</strong>.")
                                + card(
                                                row("Company", esc(client.getCompanyName()))
                                                                + row("Contract Expiry", expiryDate)
                                                                + rowBold("Days Remaining", daysToExpiry + " days"))
                                + (urgent
                                                ? "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                                                                + "style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:16px;'>"
                                                                + "<tr><td style='padding:14px 18px;font-family:Arial,sans-serif;color:#dc2626;font-size:13px;'>"
                                                                + "<strong>If your contract is not renewed by the expiry date, your portal access will be suspended "
                                                                + "and officer deployment will be paused.</strong></td></tr></table>"
                                                : "")
                                + para("Please contact your operations manager to discuss renewal terms. Once agreed and signed, "
                                                + "your account will be updated with the new contract period.")
                                + cta("Contact Us to Renew", "mailto:" + fromEmail)
                                + buildFooter();

                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.CONTRACT_RENEWAL, client.getClientId());
        }

        @Transactional
        public void sendContractExpiredEmail(Client client) {
                String subject = "Your Contract Has Expired — Account Suspended";

                String body = buildHeader()
                                + sectionTitle("Contract Expired &#8212; Account Suspended")
                                + para("Dear <strong>" + esc(client.getCompanyName())
                                                + "</strong>, your security service contract with Ace Front Line Security Solutions has expired as of "
                                                + (client.getContractEndDate() != null
                                                                ? "<strong>" + client.getContractEndDate() + "</strong>"
                                                                : "the expiry date")
                                                + ".")
                                + cardRed(
                                                row("Company", esc(client.getCompanyName()))
                                                                + row("Expiry Date", client.getContractEndDate() != null
                                                                                ? client.getContractEndDate().toString()
                                                                                : "—")
                                                                + row("Account Status",
                                                                                "<strong style='color:#dc2626;'>SUSPENDED</strong>"))
                                + para("<strong>Your portal access has been suspended.</strong> All historical data &#8212; invoices, "
                                                + "payment records, officer logs, and feedback &#8212; is preserved and will be fully restored upon renewal.")
                                + para("To renew your contract and restore access, please contact us as soon as possible:")
                                + para("&#128231; <a href='mailto:" + fromEmail + "' style='color:#EAB308;'>"
                                                + fromEmail + "</a> &nbsp;|&nbsp; "
                                                + "&#128222; <strong>0114848177</strong>")
                                + cta("Contact Us to Renew", "mailto:" + fromEmail)
                                + buildFooter();

                sendAndLog(client.getContactPersonEmail(), client.getCompanyName(),
                                subject, body, EmailType.CONTRACT_EXPIRED, client.getClientId());
        }

        // ═════════════════════════════════════════════════════════════════════════
        // PRIVATE HELPERS FOR NEW METHODS
        // ═════════════════════════════════════════════════════════════════════════

        private String buildHeader() {
                String logoHtml = hasBrandLogo()
                                ? "<img src='cid:" + LOGO_CID + "' alt='Ace Front Line Security Solutions' "
                                                + "style='display:block;width:42px;height:42px;border-radius:50%;object-fit:cover;'>"
                                : "<div style='width:42px;height:42px;border-radius:50%;background:#EAB308;color:#000;"
                                                + "font-family:Arial,sans-serif;font-weight:900;font-size:20px;line-height:42px;text-align:center;'>A</div>";

                return "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
                                + "<meta name='viewport' content='width=device-width,initial-scale=1'></head>"
                                + "<body style='margin:0;padding:0;background-color:#ededed;'>"
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#ededed;padding:20px 8px;'>"
                                + "<tr><td align='center'>"
                                + "<table role='presentation' width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;box-shadow:0 8px 24px rgba(0,0,0,.18);'>"
                                + "<tr><td style='background:#000000;border-radius:0;padding:16px 22px 14px;'>"
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>"
                                + "<td style='width:52px;vertical-align:middle;'>" + logoHtml + "</td>"
                                + "<td style='font-family:Arial,sans-serif;color:#EAB308;font-weight:900;font-size:29px;letter-spacing:1px;text-transform:uppercase;vertical-align:middle;padding-left:10px;'>"
                                + "Ace Front Line Security Solutions"
                                + "</td>"
                                + "</tr></table>"
                                + "</td></tr>"
                                + "<tr><td style='background:#EAB308;height:2px;font-size:0;line-height:0;'>&nbsp;</td></tr>"
                                + "<tr><td style='background:#f6f6f6;padding:30px 30px 22px;font-family:Arial,sans-serif;border-left:1px solid #dedede;border-right:1px solid #dedede;'>";
        }

        private String buildClientHeader() {
                return buildHeader();
        }

        private String buildClientFooter() {
                return "</td></tr>"
                                + "<tr><td style='background:#f0f0f0;border-left:1px solid #dedede;border-right:1px solid #dedede;padding:14px 24px;font-family:Arial,sans-serif;color:#6b7280;font-size:11px;text-align:center;'>"
                                + "Need assistance? Our Client Portal and Support team are available 24/7."
                                + "</td></tr>"
                                + "<tr><td style='background:#f7f7f7;border-left:1px solid #dedede;border-right:1px solid #dedede;border-bottom:1px solid #dedede;border-radius:0 0 8px 8px;padding:18px 24px;font-family:Arial,sans-serif;'>"
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                                + "<tr>"
                                + "<td style='color:#4b5563;font-size:11px;line-height:1.7;'>"
                                + "<strong style='color:#111827;'>ACE FRONT LINE SECURITY SOLUTIONS</strong><br>"
                                + "189/2, Sandatenna Mawatha, Battaramulla"
                                + "</td>"
                                + "<td align='right' style='color:#6b7280;font-size:11px;vertical-align:top;'>"
                                + "<span style='display:block;color:#6b7280;'>Contact: acefrontline@gmail.com</span>"
                                + "<span style='display:block;color:#6b7280;'>Tel: 0114848177 / 0112867359</span>"
                                + "</td></tr></table>"
                                + "</td></tr>"
                                + "</table></td></tr></table></body></html>";
        }

        private String buildFooter() {
                return "</td></tr>"
                                + "<tr><td style='background:#f0f0f0;border-left:1px solid #dedede;border-right:1px solid #dedede;padding:14px 24px;font-family:Arial,sans-serif;color:#6b7280;font-size:11px;text-align:center;'>"
                                + "Need technical assistance? 24/7 Operations Center is standing by."
                                + "</td></tr>"
                                + "<tr><td style='background:#f7f7f7;border-left:1px solid #dedede;border-right:1px solid #dedede;border-bottom:1px solid #dedede;border-radius:0 0 8px 8px;padding:18px 24px;font-family:Arial,sans-serif;'>"
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                                + "<tr>"
                                + "<td style='color:#4b5563;font-size:11px;line-height:1.7;'>"
                                + "<strong style='color:#111827;'>ACE FRONT LINE SECURITY SOLUTIONS</strong><br>"
                                + "123 Security Plaza, London, EC1A 1BE<br>"
                                + "VAT: 101127788-7000 &nbsp;|&nbsp; Reg: 09876543"
                                + "</td>"
                                + "<td align='right' style='color:#6b7280;font-size:11px;vertical-align:top;'>"
                                + "<span style='display:block;color:#6b7280;'>Contact: " + fromEmail + "</span>"
                                + "<span style='display:block;color:#6b7280;'>Tel: 0114848177</span>"
                                + "</td></tr></table>"
                                + "</td></tr>"
                                + "</table></td></tr></table></body></html>";
        }

        private String row(String label, String value) {
                return "<tr>"
                                + "<td style='padding:7px 16px 7px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;width:160px;'>"
                                + label + "</td>"
                                + "<td style='padding:7px 0;color:#111827;font-size:13px;font-weight:600;vertical-align:top;'>"
                                + value + "</td>"
                                + "</tr>";
        }

        private String rowBold(String label, String value) {
                return "<tr style='border-top:1px solid #e5e7eb;'>"
                                + "<td style='padding:10px 16px 10px 0;color:#374151;font-size:14px;font-weight:700;vertical-align:top;width:160px;'>"
                                + label + "</td>"
                                + "<td style='padding:10px 0;color:#EAB308;font-size:16px;font-weight:800;vertical-align:top;'>"
                                + value + "</td>"
                                + "</tr>";
        }

        private String card(String content) {
                return "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                                + "style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:24px 0;'>"
                                + "<tr><td style='padding:20px 24px;'>"
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                                + content
                                + "</table></td></tr></table>";
        }

        private String cardRed(String content) {
                return "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                                + "style='background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin:24px 0;'>"
                                + "<tr><td style='padding:20px 24px;'>"
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                                + content
                                + "</table></td></tr></table>";
        }

        private String cardGreen(String content) {
                return "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                                + "style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin:24px 0;'>"
                                + "<tr><td style='padding:20px 24px;'>"
                                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                                + content
                                + "</table></td></tr></table>";
        }

        private String code(String text) {
                return "<code style='background:#111827;color:#EAB308;padding:2px 8px;"
                                + "border-radius:4px;font-size:14px;'>" + text + "</code>";
        }

        private String warn(String message) {
                return "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                                + "style='background:#fefce8;border:1px solid #fde047;border-radius:8px;margin-bottom:24px;'>"
                                + "<tr><td style='padding:14px 18px;color:#854d0e;font-family:Arial,sans-serif;font-size:13px;'>"
                                + "&#9888;&nbsp; " + message
                                + "</td></tr></table>";
        }

        private String sectionTitle(String title) {
                return "<h2 style='font-family:Arial,sans-serif;color:#111827;font-size:18px;"
                                + "font-weight:800;margin:0 0 8px 0;border-bottom:3px solid #EAB308;'"
                                + ">"
                                + title + "</h2>";
        }

        private String para(String text) {
                return "<p style='font-family:Arial,sans-serif;font-size:14px;color:#4b5563;"
                                + "line-height:1.7;margin:10px 0;'>" + text + "</p>";
        }

        private String cta(String label, String url) {
                return "<table role='presentation' cellpadding='0' cellspacing='0' align='center' style='margin:24px auto 0;'>"
                                + "<tr><td style='background:#EAB308;border-radius:8px;'>"
                                + "<a href='" + url + "' style='display:inline-block;padding:14px 32px;"
                                + "font-family:Arial,sans-serif;font-size:14px;font-weight:800;"
                                + "color:#000000;text-decoration:none;letter-spacing:0.5px;'>"
                                + label + " &#8594;"
                                + "</a></td></tr></table>";
        }

        private String portal(String path) {
                String base = portalUrl == null ? "http://localhost:5173" : portalUrl.trim();
                if (base.endsWith("/")) {
                        base = base.substring(0, base.length() - 1);
                }

                if (path == null || path.isBlank()) {
                        return base;
                }

                return path.startsWith("/") ? base + path : base + "/" + path;
        }

        private String fmt(BigDecimal value) {
                if (value == null)
                        return "0.00";
                return String.format("%,.2f", value.doubleValue());
        }

        private String esc(String input) {
                if (input == null)
                        return "";
                return input.replace("&", "&amp;")
                                .replace("<", "&lt;")
                                .replace(">", "&gt;")
                                .replace("\"", "&quot;")
                                .replace("'", "&#x27;");
        }

        private void sendAndLog(String toEmail, String toName, String subject,
                        String htmlBody, EmailType type, Integer relatedId) {
                sendAndLog(toEmail, toName, subject, htmlBody, type, relatedId, null, null);
        }

        private void sendAndLog(String toEmail, String toName, String subject,
                        String htmlBody, EmailType type, Integer relatedId, byte[] attachment, String fileName) {
                boolean sent = sendHtmlEmail(toEmail, toName, subject, htmlBody, attachment, fileName);
                saveEmailLog(toEmail, toName, subject, htmlBody, type, relatedId, sent,
                                sent ? null : "Failed to send email via SMTP");
        }

        private boolean sendHtmlEmail(String toEmail, String toName,
                        String subject, String htmlBody) {
                return sendHtmlEmail(toEmail, toName, subject, htmlBody, null, null);
        }

        private boolean sendHtmlEmail(String toEmail, String toName,
                        String subject, String htmlBody, byte[] attachment, String fileName) {
                try {
                        MimeMessage message = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                        helper.setFrom(fromEmail, FROM_NAME);
                        helper.setTo(toEmail);
                        helper.setSubject(subject);
                        helper.setText(htmlBody, true);

                        if (hasBrandLogo()) {
                                helper.addInline(LOGO_CID, new FileSystemResource(getAbsoluteLogoPath()));
                        }

                        if (attachment != null && fileName != null) {
                                helper.addAttachment(fileName, new ByteArrayResource(attachment));
                        }

                        mailSender.send(message);
                        String recipientLabel = (toName != null && !toName.isBlank()) ? toName + " <" + toEmail + ">"
                                        : toEmail;
                        log.info("Email sent [{}] → {}", subject, recipientLabel);
                        return true;

                } catch (MessagingException | MailException | UnsupportedEncodingException e) {
                        log.error("Unexpected error sending email to {}: {}", toEmail, e.getMessage());
                        return false;
                }
        }

        private void saveEmailLog(String recipientEmail, String recipientName,
                        String subject, String body,
                        EmailType type, Integer relatedId,
                        boolean sent, String errorMessage) {
                try {
                        EmailLog emailLog = new EmailLog();
                        emailLog.setRecipientEmail(recipientEmail);
                        emailLog.setRecipientName(recipientName);
                        emailLog.setSubject(subject);
                        emailLog.setBody(body);
                        emailLog.setEmailType(type);
                        emailLog.setRelatedId(relatedId);
                        emailLog.setStatus(sent ? EmailStatus.SENT : EmailStatus.FAILED);
                        emailLog.setSentAt(LocalDateTime.now());
                        emailLog.setErrorMessage(errorMessage);
                        emailLogRepository.save(emailLog);
                } catch (Exception e) {
                        log.error("⚠ Failed to save email log for {}: {}", recipientEmail, e.getMessage());
                }
        }

        /*
         * public EmailService(JavaMailSender mailSender) {
         * this.mailSender = mailSender;
         * }
         */

        public void sendSalaryEmail(String toEmail, String employeeName, String month, byte[] payslipPdf,
                        String companyName) throws MessagingException {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true);

                helper.setTo(toEmail);
                helper.setSubject("Payslip for " + month);

                String emailBody = String.format(
                                "Dear %s,\n\n" +
                                                "I hope you are doing well.\n\n" +
                                                "This is to inform you that your salary for the month of %s has been successfully processed and credited to your bank account.\n\n"
                                                +
                                                "Please review your account at your convenience and let us know if you have any questions or require further clarification.\n\n"
                                                +
                                                "Thank you for your continued contribution and dedication.\n\n" +
                                                "Best regards,\n\n" +
                                                "%s",
                                employeeName, month, companyName);

                helper.setText(emailBody);

                helper.addAttachment("Payslip_" + month + ".pdf", new ByteArrayResource(payslipPdf));

                mailSender.send(message);
        }
}