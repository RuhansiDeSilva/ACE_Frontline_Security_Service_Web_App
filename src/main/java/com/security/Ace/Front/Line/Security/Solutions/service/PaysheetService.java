package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.PaysheetRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.AdminPayrollRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.Paysheet;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.PayrollStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.PaysheetRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class PaysheetService {

    private final PaysheetRepository paysheetRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PayrollSlipService payrollSlipService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(PaysheetService.class);

    @Transactional
    public Paysheet generatePaysheet(String accountExecUsername, PaysheetRequest request) {
        User accountExec = userRepository.findByUsername(accountExecUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Account executive not found"));

        User employee = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (paysheetRepository.findByUserAndPayMonth(employee, request.getPayMonth()).isPresent()) {
            throw new BusinessException("Paysheet already generated for this month");
        }

        double basicSalary = request.getBasicSalary() != null ? request.getBasicSalary()
                : (employee.getBasicSalary() != null ? employee.getBasicSalary() : 0.0);
        double allowances = request.getAllowances() != null ? request.getAllowances() : 0.0;
        double otherDeductions = request.getOtherDeductions() != null ? request.getOtherDeductions() : 0.0;

        double netSalary = basicSalary + allowances - otherDeductions;

        Paysheet paysheet = Paysheet.builder()
                .user(employee)
                .payMonth(request.getPayMonth())
                .basicSalary(basicSalary)
                .allowances(allowances)
                .otherDeductions(otherDeductions)
                .netSalary(netSalary)
                .remarks(request.getRemarks())
                .generatedBy(accountExec)
                .build();

        return paysheetRepository.save(paysheet);
    }

    @Transactional
    public Paysheet createAdminPayroll(String accountExecUsername, AdminPayrollRequest request) {
        User accountExec = userRepository.findByUsername(accountExecUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Account executive not found"));

        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // Serialize allowancesDetail to JSON string
        String allowancesDetailJson = null;
        try {
            if (request.getAllowancesDetail() != null && !request.getAllowancesDetail().isEmpty()) {
                allowancesDetailJson = objectMapper.writeValueAsString(request.getAllowancesDetail());
            }
        } catch (Exception e) {
            // If JSON serialization fails, continue without it
        }

        Paysheet paysheet = Paysheet.builder()
                .user(employee)
                .payMonth(request.getPayMonth())
                .basicSalary(request.getBasicSalary())
                .allowances(request.getAllowances())
                .allowancesDetail(allowancesDetailJson)
                .otherDeductions(request.getOtherDeductions())
                .netSalary(request.getBasicSalary() + request.getAllowances() 
                        - (request.getOtherDeductions() != null ? request.getOtherDeductions() : 0.0))
                .remarks(request.getRemarks())
                .generatedBy(accountExec)
                .status(PayrollStatus.DRAFT)
                .build();

        return paysheetRepository.save(paysheet);
    }

    @Transactional
    public Paysheet submitForApproval(Long payrollId) {
        Paysheet paysheet = paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));

        if (!paysheet.getStatus().equals(PayrollStatus.DRAFT)) {
            throw new BusinessException("Only draft payrolls can be submitted for approval");
        }

        paysheet.setStatus(PayrollStatus.SUBMITTED_TO_DIRECTOR);
        paysheet.setSubmittedAt(LocalDateTime.now());
        return paysheetRepository.save(paysheet);
    }

    public Paysheet getPayrollById(Long payrollId) {
        return paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found with id: " + payrollId));
    }

    public List<Paysheet> getPendingApprovals() {
        return paysheetRepository.findByStatus(PayrollStatus.SUBMITTED_TO_DIRECTOR);
    }

    @Transactional
    public Paysheet approvePayroll(String directorUsername, Long payrollId, Map<String, Object> body) {
        User director = userRepository.findByUsername(directorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Director not found"));

        Paysheet paysheet = paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));

        // Verify payroll is in correct status for approval
        if (!paysheet.getStatus().equals(PayrollStatus.SUBMITTED_TO_DIRECTOR)) {
            throw new BusinessException("Payroll must be in SUBMITTED_TO_DIRECTOR status to be approved. Current status: " + paysheet.getStatus());
        }

        // If body contains updated allowances, update it
        if (body != null && body.containsKey("allowances")) {
            Object allowancesObj = body.get("allowances");
            if (allowancesObj != null) {
                Double newAllowances = Double.valueOf(allowancesObj.toString());
                paysheet.setAllowances(newAllowances);
            }
        }

        // Recalculate net salary (OT, loan deduction, and advance deduction have been removed)
        paysheet.setNetSalary(paysheet.getBasicSalary() + paysheet.getAllowances() 
                - (paysheet.getOtherDeductions() != null ? paysheet.getOtherDeductions() : 0.0));

        // Set approval metadata
        paysheet.setApprovedBy(director);
        paysheet.setApprovedAt(LocalDateTime.now());
        
        if (body != null && body.containsKey("approvalRemarks")) {
            Object remarksObj = body.get("approvalRemarks");
            if (remarksObj != null) {
                paysheet.setApprovalRemarks(remarksObj.toString());
            }
        }

        paysheet.setStatus(PayrollStatus.APPROVED_BY_DIRECTOR);
        
        // Notify the account executive - only if they exist
        if (paysheet.getGeneratedBy() != null) {
            try {
                notificationService.notifyUser(paysheet.getGeneratedBy().getId(), 
                    "Your payroll for " + paysheet.getUser().getFullName() + " (" + paysheet.getPayMonth() + ") has been approved by the director.");
            } catch (Exception e) {
                // Log the error but don't fail the approval if notification fails
                System.err.println("Failed to send notification: " + e.getMessage());
            }
        }

        Paysheet savedPaysheet = paysheetRepository.save(paysheet);

        // Generate payroll slip for the approved payroll
        try {
            payrollSlipService.generateSlip(savedPaysheet);
        } catch (Exception e) {
            System.err.println("Failed to generate payroll slip: " + e.getMessage());
        }

        return savedPaysheet;
    }

    @Transactional
    public Paysheet rejectPayroll(String directorUsername, Long payrollId, String reason) {
        User director = userRepository.findByUsername(directorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Director not found"));

        Paysheet paysheet = paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));

        // Verify payroll is in correct status for rejection
        if (!paysheet.getStatus().equals(PayrollStatus.SUBMITTED_TO_DIRECTOR)) {
            throw new BusinessException("Payroll must be in SUBMITTED_TO_DIRECTOR status to be rejected. Current status: " + paysheet.getStatus());
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new BusinessException("Rejection reason is required");
        }

        paysheet.setStatus(PayrollStatus.REJECTED_BY_DIRECTOR);
        paysheet.setRejectionReason(reason);
        paysheet.setRejectedAt(LocalDateTime.now());
        paysheet.setApprovedBy(director);

        // Notify the account executive - only if they exist
        if (paysheet.getGeneratedBy() != null) {
            try {
                notificationService.notifyUser(paysheet.getGeneratedBy().getId(), 
                    "Your payroll for " + paysheet.getUser().getFullName() + " (" + paysheet.getPayMonth() + ") has been rejected. Reason: " + reason);
            } catch (Exception e) {
                // Log the error but don't fail the rejection if notification fails
                System.err.println("Failed to send notification: " + e.getMessage());
            }
        }

        return paysheetRepository.save(paysheet);
    }

    public List<Paysheet> getApprovedList() {
        return paysheetRepository.findByStatus(PayrollStatus.APPROVED_BY_DIRECTOR);
    }

    @Transactional
    public Paysheet sendToBank(Long payrollId) {
        logger.info("Starting sendToBank for payrollId: {}", payrollId);
        Paysheet paysheet = paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));

        if (!paysheet.getStatus().equals(PayrollStatus.APPROVED_BY_DIRECTOR)) {
            throw new BusinessException("Only approved payrolls can be sent to bank");
        }

        paysheet.setStatus(PayrollStatus.SENT_TO_BANK);
        paysheet.setSentToBankAt(LocalDateTime.now());
        paysheetRepository.save(paysheet);
        logger.info("Payroll {} status updated to SENT_TO_BANK", payrollId);

        // Notify the employee
        try {
            String notificationMessage = "Your salary for " + paysheet.getPayMonth() + " (LKR " + paysheet.getNetSalary() + ") has been sent to the bank. Bank: " + 
                (paysheet.getUser().getBankName() != null ? paysheet.getUser().getBankName() : "N/A");
            notificationService.notifyUser(paysheet.getUser().getId(), notificationMessage);
            logger.info("Notification sent to user {} for payroll {}", paysheet.getUser().getId(), payrollId);
        } catch (Exception e) {
            logger.error("Failed to send notification for payroll {}: {}", payrollId, e.getMessage(), e);
        }

        return paysheet;
    }

    @Transactional
    public void proceedAllToBank(HttpServletResponse response) throws IOException {
        logger.info("Starting proceedAllToBank - generating Excel and sending all approved payrolls to bank");
        
        List<Paysheet> approvedPayrolls = paysheetRepository.findByStatus(PayrollStatus.APPROVED_BY_DIRECTOR);
        logger.info("Found {} approved payrolls to process", approvedPayrolls.size());
        
        if (approvedPayrolls.isEmpty()) {
            logger.warn("No approved payrolls found to process");
            throw new BusinessException("No approved payrolls to process");
        }

        // Generate Excel
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Payroll Bank Submission");
            
            // Header
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Employee Name");
            header.createCell(1).setCellValue("Employee ID");
            header.createCell(2).setCellValue("Bank Name");
            header.createCell(3).setCellValue("Account Number");
            header.createCell(4).setCellValue("Branch");
            header.createCell(5).setCellValue("Net Salary");
            header.createCell(6).setCellValue("Month");

            int rowNum = 1;
            for (Paysheet p : approvedPayrolls) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getUser().getFullName());
                row.createCell(1).setCellValue(String.valueOf(p.getUser().getId()));
                row.createCell(2).setCellValue(p.getUser().getBankName() != null ? p.getUser().getBankName() : "N/A");
                row.createCell(3).setCellValue(p.getUser().getBankAccountNumber() != null ? p.getUser().getBankAccountNumber() : "N/A");
                row.createCell(4).setCellValue(p.getUser().getBankBranch() != null ? p.getUser().getBankBranch() : "N/A");
                row.createCell(5).setCellValue(p.getNetSalary());
                row.createCell(6).setCellValue(p.getPayMonth());
            }
            
            logger.info("Excel file created with {} payroll entries", rowNum - 1);

            // Now send all payrolls to bank with notifications
            int successCount = 0;
            for (Paysheet p : approvedPayrolls) {
                try {
                    logger.info("Processing payroll {} for employee {}", p.getId(), p.getUser().getFullName());
                    
                    // Update status
                    p.setStatus(PayrollStatus.SENT_TO_BANK);
                    p.setSentToBankAt(LocalDateTime.now());
                    paysheetRepository.save(p);

                    // Notify the employee
                    try {
                        String notificationMessage = "Your salary for " + p.getPayMonth() + " (LKR " + p.getNetSalary() + ") has been sent to the bank. Bank: " + 
                            (p.getUser().getBankName() != null ? p.getUser().getBankName() : "N/A");
                        notificationService.notifyUser(p.getUser().getId(), notificationMessage);
                        logger.info("Notification sent to user {} for payroll {}", p.getUser().getId(), p.getId());
                    } catch (Exception e) {
                        logger.error("Failed to send notification for payroll {}: {}", p.getId(), e.getMessage(), e);
                    }
                    
                    successCount++;
                } catch (Exception e) {
                    logger.error("Failed to process payroll {}: {}", p.getId(), e.getMessage(), e);
                }
            }
            
            logger.info("Successfully processed {}/{} payrolls to bank", successCount, approvedPayrolls.size());

            // Write Excel to response
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=payroll_bank_submission_" + java.time.LocalDate.now() + ".xlsx");
            workbook.write(response.getOutputStream());
            logger.info("Excel file written to response stream");
        } catch (IOException e) {
            logger.error("Error during proceedAllToBank: {}", e.getMessage(), e);
            throw e;
        }
    }

    public List<Paysheet> getMyPaysheets(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return paysheetRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Paysheet> getPaysheetsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return paysheetRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Paysheet> getAllPaysheets() {
        return paysheetRepository.findAll();
    }

    // ============ MAPPER ============
    public PayrollResponse mapToPayrollResponse(Paysheet paysheet) {
        Map<String, Double> allowancesDetail = null;
        try {
            if (paysheet.getAllowancesDetail() != null && !paysheet.getAllowancesDetail().isEmpty()) {
                allowancesDetail = objectMapper.readValue(paysheet.getAllowancesDetail(), 
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Double.class));
            }
        } catch (Exception e) {
            // If JSON deserialization fails, continue without it
        }

        return PayrollResponse.builder()
                .id(paysheet.getId())
                .employeeId(paysheet.getUser().getId())
                .employeeName(paysheet.getUser().getFullName())
                .employeeRole(paysheet.getUser().getRole().toString())
                .payMonth(paysheet.getPayMonth())
                .payYear(paysheet.getPayYear())
                .basicSalary(paysheet.getBasicSalary())
                .allowances(paysheet.getAllowances())
                .allowancesDetail(allowancesDetail)
                .otherDeductions(paysheet.getOtherDeductions())
                .netSalary(paysheet.getNetSalary())
                .status(paysheet.getStatus())
                .submittedByName(paysheet.getGeneratedBy() != null ? paysheet.getGeneratedBy().getFullName() : null)
                .submittedAt(paysheet.getSubmittedAt())
                .approvedByName(paysheet.getApprovedBy() != null ? paysheet.getApprovedBy().getFullName() : null)
                .approvedAt(paysheet.getApprovedAt())
                .sentToBankAt(paysheet.getSentToBankAt())
                .approvalRemarks(paysheet.getApprovalRemarks())
                .rejectionReason(paysheet.getRejectionReason())
                .remarks(paysheet.getRemarks())
                .createdAt(paysheet.getCreatedAt())
                .updatedAt(paysheet.getCreatedAt())
                .build();
    }
}
