package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollSlipResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.Paysheet;
import com.security.Ace.Front.Line.Security.Solutions.entity.PayrollSlip;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.PayrollSlipRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollSlipService {

    private final PayrollSlipRepository payrollSlipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public PayrollSlip generateSlip(Paysheet paysheet) {
        if (paysheet == null || paysheet.getUser() == null) {
            throw new BusinessException("Invalid paysheet data");
        }

        // Check if slip already exists for this paysheet
        if (payrollSlipRepository.findByPaysheetId(paysheet.getId()).isPresent()) {
            return payrollSlipRepository.findByPaysheetId(paysheet.getId()).orElseThrow();
        }

        PayrollSlip slip = PayrollSlip.builder()
                .user(paysheet.getUser())
                .paysheet(paysheet)
                .payMonth(paysheet.getPayMonth())
                .basicSalary(paysheet.getBasicSalary())
                .allowances(paysheet.getAllowances())
                .otherDeductions(paysheet.getOtherDeductions())
                .netSalary(paysheet.getNetSalary())
                .approvedBy(paysheet.getApprovedBy())
                .approvedAt(paysheet.getApprovedAt())
                .approvalRemarks(paysheet.getApprovalRemarks())
                .remarks(paysheet.getRemarks())
                .isDownloaded(false)
                .isViewed(false)
                .downloadCount(0)
                .build();

        // Calculate gross and total deductions
        slip.setGrossSalary(slip.calculateGrossSalary());
        slip.setTotalDeductions(slip.calculateTotalDeductions());

        PayrollSlip savedSlip = payrollSlipRepository.save(slip);

        // Notify the user about the generated payroll slip
        try {
            notificationService.notifyUser(
                    paysheet.getUser().getId(),
                    "Your payroll slip for " + paysheet.getPayMonth() + " has been generated and is ready for download."
            );
        } catch (Exception e) {
            System.err.println("Failed to notify user about payroll slip: " + e.getMessage());
        }

        return savedSlip;
    }

    @Transactional(readOnly = true)
    public PayrollSlipResponse getSlipById(Long slipId) {
        PayrollSlip slip = payrollSlipRepository.findById(slipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll slip not found"));
        return mapToResponse(slip);
    }

    @Transactional
    public PayrollSlipResponse viewSlip(Long slipId) {
        PayrollSlip slip = payrollSlipRepository.findById(slipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll slip not found"));

        if (!slip.getIsViewed()) {
            slip.setIsViewed(true);
            slip.setViewedAt(LocalDateTime.now());
            payrollSlipRepository.save(slip);
        }

        return mapToResponse(slip);
    }

    @Transactional
    public PayrollSlipResponse downloadSlip(Long slipId) {
        PayrollSlip slip = payrollSlipRepository.findById(slipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll slip not found"));

        slip.setIsDownloaded(true);
        slip.setDownloadedAt(LocalDateTime.now());
        slip.setDownloadCount((slip.getDownloadCount() != null ? slip.getDownloadCount() : 0) + 1);

        PayrollSlip updated = payrollSlipRepository.save(slip);

        // Notify about download
        try {
            notificationService.notifyUser(
                    slip.getUser().getId(),
                    "Your payroll slip for " + slip.getPayMonth() + " has been downloaded."
            );
        } catch (Exception e) {
            System.err.println("Failed to notify about slip download: " + e.getMessage());
        }

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<PayrollSlipResponse> getUserSlips(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return getUserSlipsById(user.getId());
    }

    @Transactional(readOnly = true)
    public List<PayrollSlipResponse> getUserSlipsById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return payrollSlipRepository.findByUserOrderByPayMonthDesc(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PayrollSlipResponse> getSlipsForMonth(String payMonth) {
        return payrollSlipRepository.findByPayMonthOrderByUserIdAsc(payMonth)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PayrollSlipResponse getLatestSlip(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return payrollSlipRepository.findLatestForUser(user)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("No payroll slip found for this user"));
    }

    @Transactional(readOnly = true)
    public List<PayrollSlipResponse> getSlipHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return payrollSlipRepository.findByUserOrderByPayMonthDesc(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void exportSlipToExcel(Long slipId, HttpServletResponse response) throws IOException {
        PayrollSlip slip = payrollSlipRepository.findById(slipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll slip not found"));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Payroll Slip");

            // Set column widths
            sheet.setColumnWidth(0, 25 * 256);
            sheet.setColumnWidth(1, 20 * 256);
            sheet.setColumnWidth(2, 15 * 256);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle valueStyle = workbook.createCellStyle();
            valueStyle.setBorderBottom(BorderStyle.THIN);
            valueStyle.setBorderLeft(BorderStyle.THIN);
            valueStyle.setBorderRight(BorderStyle.THIN);
            valueStyle.setBorderTop(BorderStyle.THIN);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(valueStyle);
            currencyStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));

            int rowNum = 0;

            // Title
            Row titleRow = sheet.createRow(rowNum++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("PAYROLL SLIP");
            titleCell.setCellStyle(headerStyle);
            titleRow.setHeightInPoints(25);

            rowNum++; // Blank row

            // Employee Information
            createLabelValueRow(sheet, rowNum++, "Slip Number:", slip.getSlipNumber(), valueStyle);
            createLabelValueRow(sheet, rowNum++, "Employee Name:", slip.getUser().getFullName(), valueStyle);
            createLabelValueRow(sheet, rowNum++, "Employee ID:", slip.getUser().getId().toString(), valueStyle);
            createLabelValueRow(sheet, rowNum++, "Role:", slip.getUser().getRole().toString(), valueStyle);
            createLabelValueRow(sheet, rowNum++, "Pay Month:", slip.getPayMonth(), valueStyle);

            rowNum++; // Blank row

            // Earnings Section
            Row earningsHeaderRow = sheet.createRow(rowNum++);
            createHeaderCell(earningsHeaderRow.createCell(0), "Earnings", headerStyle);
            createHeaderCell(earningsHeaderRow.createCell(2), "Amount", headerStyle);

            createLabelValueRow(sheet, rowNum++, "Basic Salary:", slip.getBasicSalary().toString(), currencyStyle);
            if (slip.getAllowances() > 0) {
                createLabelValueRow(sheet, rowNum++, "Allowances:", slip.getAllowances().toString(), currencyStyle);
            }
            createLabelValueRow(sheet, rowNum++, "Gross Salary:", slip.getGrossSalary().toString(), currencyStyle);

            rowNum++; // Blank row

            // Deductions Section
            Row deductionsHeaderRow = sheet.createRow(rowNum++);
            createHeaderCell(deductionsHeaderRow.createCell(0), "Deductions", headerStyle);
            createHeaderCell(deductionsHeaderRow.createCell(2), "Amount", headerStyle);

            if (slip.getOtherDeductions() > 0) {
                createLabelValueRow(sheet, rowNum++, "Other Deductions:", slip.getOtherDeductions().toString(), currencyStyle);
            }
            createLabelValueRow(sheet, rowNum++, "Total Deductions:", slip.getTotalDeductions().toString(), currencyStyle);

            rowNum++; // Blank row

            // Net Salary
            Row netRow = sheet.createRow(rowNum++);
            Cell netLabelCell = netRow.createCell(0);
            netLabelCell.setCellValue("NET SALARY");
            netLabelCell.setCellStyle(headerStyle);
            Cell netValueCell = netRow.createCell(2);
            netValueCell.setCellValue(slip.getNetSalary());
            netValueCell.setCellStyle(currencyStyle);

            rowNum++; // Blank row

            // Footer Information
            if (slip.getApprovedAt() != null) {
                createLabelValueRow(sheet, rowNum++, "Approved By:", slip.getApprovedBy() != null ? slip.getApprovedBy().getFullName() : "N/A", valueStyle);
                createLabelValueRow(sheet, rowNum++, "Approved Date:", slip.getApprovedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), valueStyle);
            }
            createLabelValueRow(sheet, rowNum++, "Generated Date:", slip.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), valueStyle);

            // Set response headers
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=Payroll_Slip_" + slip.getSlipNumber() + ".xlsx");
            workbook.write(response.getOutputStream());
        }
    }

    private void createLabelValueRow(Sheet sheet, int rowNum, String label, String value, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(style);
        Cell valueCell = row.createCell(2);
        valueCell.setCellValue(value);
        valueCell.setCellStyle(style);
    }

    private void createHeaderCell(Cell cell, String value, CellStyle style) {
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    public PayrollSlipResponse mapToResponse(PayrollSlip slip) {
        return PayrollSlipResponse.builder()
                .id(slip.getId())
                .userId(slip.getUser().getId())
                .userName(slip.getUser().getFullName())
                .userRole(slip.getUser().getRole().toString())
                .userEmail(slip.getUser().getEmail())
                .userPhone(slip.getUser().getMobileNumber())
                .payMonth(slip.getPayMonth())
                .slipNumber(slip.getSlipNumber())
                .basicSalary(slip.getBasicSalary())
                .allowances(slip.getAllowances())
                .otherDeductions(slip.getOtherDeductions())
                .netSalary(slip.getNetSalary())
                .grossSalary(slip.getGrossSalary())
                .totalDeductions(slip.getTotalDeductions())
                .approvedByName(slip.getApprovedBy() != null ? slip.getApprovedBy().getFullName() : null)
                .approvedAt(slip.getApprovedAt())
                .approvalRemarks(slip.getApprovalRemarks())
                .generatedAt(slip.getGeneratedAt())
                .downloadedAt(slip.getDownloadedAt())
                .downloadCount(slip.getDownloadCount())
                .isDownloaded(slip.getIsDownloaded())
                .isViewed(slip.getIsViewed())
                .viewedAt(slip.getViewedAt())
                .remarks(slip.getRemarks())
                .build();
    }
}
