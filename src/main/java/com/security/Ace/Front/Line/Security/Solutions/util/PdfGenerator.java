package com.security.Ace.Front.Line.Security.Solutions.util;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryAllowance;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryDeduction;
import com.security.Ace.Front.Line.Security.Solutions.repository.SalaryAllowanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SalaryDeductionRepository;
import org.springframework.stereotype.Component;

import com.security.Ace.Front.Line.Security.Solutions.dto.SalaryTrendsDTO;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class PdfGenerator {

    private final SalaryAllowanceRepository allowanceRepository;
    private final SalaryDeductionRepository deductionRepository;

    public PdfGenerator(SalaryAllowanceRepository allowanceRepository, SalaryDeductionRepository deductionRepository) {
        this.allowanceRepository = allowanceRepository;
        this.deductionRepository = deductionRepository;
    }

    public byte[] generatePayslip(Salary salary) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = null;
        try {
            document = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Core UI Colors
            BaseColor darkNeutral = new BaseColor(23, 23, 23);
            BaseColor lightNeutral = new BaseColor(249, 250, 251);
            BaseColor primaryColor = new BaseColor(250, 204, 21);
            BaseColor borderColor = new BaseColor(229, 231, 235);
            BaseColor textColor = new BaseColor(17, 24, 39);
            BaseColor mutedColor = new BaseColor(107, 114, 128);

            BaseColor greenLight = new BaseColor(240, 253, 244);
            BaseColor greenDark = new BaseColor(21, 128, 61);
            BaseColor redLight = new BaseColor(254, 242, 242);
            BaseColor redDark = new BaseColor(185, 28, 28);

            Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.WHITE);
            Font companySubFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, primaryColor);
            Font addressFont = FontFactory.getFont(FontFactory.HELVETICA, 7, mutedColor);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.WHITE);

            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, mutedColor);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, textColor);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, textColor);
            Font sectionSubFont = FontFactory.getFont(FontFactory.HELVETICA, 7, textColor);

            // 1. HEADER SECTION
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 2, 1 });

            PdfPCell leftHeader = new PdfPCell();
            leftHeader.setBackgroundColor(darkNeutral);
            leftHeader.setBorder(Rectangle.NO_BORDER);
            leftHeader.setPadding(15);

            PdfPTable logoContainer = new PdfPTable(2);
            logoContainer.setWidthPercentage(100);
            logoContainer.setWidths(new float[] { 1, 4 });
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            try {
                Image logo = Image.getInstance("frontend/src/assets/logo.png");
                logo.scaleToFit(35, 35);
                logoCell.addElement(logo);
            } catch (Exception e) {}
            logoContainer.addCell(logoCell);

            PdfPCell cNameCell = new PdfPCell();
            cNameCell.setBorder(Rectangle.NO_BORDER);
            cNameCell.addElement(new Paragraph("ACE FRONT LINE", companyFont));
            cNameCell.addElement(new Paragraph("SECURITY SOLUTIONS (PVT) LTD", companySubFont));
            cNameCell.addElement(new Paragraph("123 Main Street, Colombo 01, Sri Lanka\nTel: +94 11 234 5678 | Email: info@acefrontline.lk", addressFont));
            logoContainer.addCell(cNameCell);
            leftHeader.addElement(logoContainer);

            PdfPCell rightHeader = new PdfPCell();
            rightHeader.setBackgroundColor(darkNeutral);
            rightHeader.setBorder(Rectangle.NO_BORDER);
            rightHeader.setPadding(15);
            rightHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);

            PdfPTable tokenTable = new PdfPTable(1);
            tokenTable.setWidthPercentage(60);
            tokenTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            PdfPCell tokenCell = new PdfPCell();
            tokenCell.setBorder(Rectangle.BOX);
            tokenCell.setBorderColor(new BaseColor(55, 65, 81));
            tokenCell.setBorderWidth(1);
            tokenCell.setBackgroundColor(new BaseColor(31, 41, 55));
            tokenCell.setPadding(8);

            Paragraph pLabel = new Paragraph("PAYSLIP", titleFont);
            pLabel.setAlignment(Element.ALIGN_CENTER);
            tokenCell.addElement(pLabel);
            Paragraph pMonth = new Paragraph(salary.getMonth(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, primaryColor));
            pMonth.setAlignment(Element.ALIGN_CENTER);
            tokenCell.addElement(pMonth);
            tokenTable.addCell(tokenCell);

            rightHeader.addElement(tokenTable);
            headerTable.addCell(leftHeader);
            headerTable.addCell(rightHeader);
            document.add(headerTable);

            // 2. METADATA STRIP
            PdfPTable metaTable = new PdfPTable(3);
            metaTable.setWidthPercentage(100);
            metaTable.addCell(createMetaCell("PAYSLIP NO:", "PAY-" + salary.getId(), lightNeutral, borderColor));
            metaTable.addCell(createMetaCell("CALCULATED:", java.time.LocalDate.now().toString(), lightNeutral, borderColor));
            metaTable.addCell(createMetaCell("PERIOD:", "01-" + salary.getMonth(), lightNeutral, borderColor));
            document.add(metaTable);
            document.add(new Paragraph(" "));

            // 3. EMPLOYEE INFORMATION
            addUISectionHeader(document, "EMPLOYEE INFORMATION", sectionTitleFont, primaryColor);
            PdfPTable empTable = new PdfPTable(3);
            empTable.setWidthPercentage(100);
            empTable.setSpacingBefore(5);
            empTable.setSpacingAfter(10);
            addGridCell(empTable, "EMPLOYEE ID", String.valueOf(salary.getOfficer().getId()), labelFont, valueFont);
            addGridCell(empTable, "EMPLOYEE NAME", salary.getOfficer().getFullName(), labelFont, valueFont);
            addGridCell(empTable, "DESIGNATION", "Security Officer", labelFont, valueFont);
            addGridCell(empTable, "DEPARTMENT", "Operations", labelFont, valueFont);
            addGridCell(empTable, "LOCATION", "Field Assigned", labelFont, valueFont);
            addGridCell(empTable, "TOTAL SHIFTS", salary.getTotalShifts() + " Shifts", labelFont, valueFont);
            document.add(empTable);

            // 4. BANK DETAILS
            addUISectionHeader(document, "BANK DETAILS", sectionTitleFont, primaryColor);
            PdfPTable bankTable = new PdfPTable(3);
            bankTable.setWidthPercentage(100);
            bankTable.setSpacingBefore(5);
            bankTable.setSpacingAfter(10);
            addGridCell(bankTable, "ACCOUNT NUMBER", salary.getOfficer().getBankAccountNumber(), labelFont, valueFont);
            addGridCell(bankTable, "BANK NAME", salary.getOfficer().getBankName(), labelFont, valueFont);
            addGridCell(bankTable, "BRANCH", salary.getOfficer().getBankBranch(), labelFont, valueFont);
            document.add(bankTable);

            // 5. SALARY BREAKDOWN
            addUISectionHeader(document, "SALARY BREAKDOWN", sectionTitleFont, primaryColor);
            PdfPTable splitTable = new PdfPTable(2);
            splitTable.setWidthPercentage(100);
            splitTable.setSpacingBefore(5);
            splitTable.setWidths(new float[] { 1, 1 });

            PdfPCell leftSplit = new PdfPCell();
            leftSplit.setBorder(Rectangle.NO_BORDER);
            leftSplit.setPaddingRight(5);
            PdfPTable earningsTable = new PdfPTable(2);
            earningsTable.setWidthPercentage(100);
            earningsTable.setWidths(new float[] { 2, 1 });
            PdfPCell eHead = new PdfPCell(new Phrase("EARNINGS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, BaseColor.WHITE)));
            eHead.setBackgroundColor(darkNeutral);
            eHead.setColspan(2);
            eHead.setPadding(6);
            eHead.setBorder(Rectangle.NO_BORDER);
            earningsTable.addCell(eHead);
            addUIDetailRow(earningsTable, "Basic Salary", formatMoney(salary.getBasicSalary()), sectionSubFont, valueFont);

            BigDecimal otAmount = salary.getSalaryAllowances().stream()
                    .filter(a -> a.getAllowanceName().toLowerCase().matches(".*(ot|overtime).*"))
                    .map(SalaryAllowance::getAllowanceAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (otAmount.compareTo(BigDecimal.ZERO) == 0) otAmount = BigDecimal.valueOf(salary.getTotalShifts() * 500);
            addUIDetailRow(earningsTable, "Overtime (" + salary.getTotalShifts() + " shifts)", formatMoney(otAmount), sectionSubFont, valueFont);
            for (SalaryAllowance a : salary.getSalaryAllowances()) {
                if (!a.getAllowanceName().toLowerCase().matches(".*(ot|overtime).*")) {
                    addUIDetailRow(earningsTable, a.getAllowanceName(), formatMoney(a.getAllowanceAmount()), sectionSubFont, valueFont);
                }
            }
            addUIBreakdownTotalRow(earningsTable, "TOTAL EARNINGS", formatMoney(salary.getTotalAllowances()), greenLight, greenDark);
            leftSplit.addElement(earningsTable);
            splitTable.addCell(leftSplit);

            PdfPCell rightSplit = new PdfPCell();
            rightSplit.setBorder(Rectangle.NO_BORDER);
            rightSplit.setPaddingLeft(5);
            PdfPTable deductionsTable = new PdfPTable(2);
            deductionsTable.setWidthPercentage(100);
            deductionsTable.setWidths(new float[] { 2, 1 });
            PdfPCell dHead = new PdfPCell(new Phrase("DEDUCTIONS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, BaseColor.WHITE)));
            dHead.setBackgroundColor(darkNeutral);
            dHead.setColspan(2);
            dHead.setPadding(6);
            dHead.setBorder(Rectangle.NO_BORDER);
            deductionsTable.addCell(dHead);
            for (SalaryDeduction d : salary.getSalaryDeductions()) {
                addUIDetailRow(deductionsTable, d.getDeductionName(), formatMoney(d.getDeductionAmount()), sectionSubFont, valueFont);
            }
            if (salary.getSalaryDeductions().isEmpty()) {
                PdfPCell emptyC = new PdfPCell(new Phrase("No deductions", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, mutedColor)));
                emptyC.setColspan(2);
                emptyC.setPadding(10);
                emptyC.setHorizontalAlignment(Element.ALIGN_CENTER);
                emptyC.setBorderColor(borderColor);
                deductionsTable.addCell(emptyC);
            }
            addUIBreakdownTotalRow(deductionsTable, "TOTAL DEDUCTIONS", formatMoney(salary.getTotalDeductions()), redLight, redDark);
            rightSplit.addElement(deductionsTable);
            splitTable.addCell(rightSplit);
            document.add(splitTable);
            document.add(new Paragraph(" "));

            // 6. NET SALARY CARD
            PdfPTable netCardTable = new PdfPTable(2);
            netCardTable.setWidthPercentage(100);
            netCardTable.setWidths(new float[]{ 2, 1 });
            PdfPCell netLeft = new PdfPCell();
            netLeft.setBackgroundColor(darkNeutral);
            netLeft.setBorder(Rectangle.NO_BORDER);
            netLeft.setPadding(15);
            netLeft.addElement(new Paragraph("NET SALARY (TAKE HOME PAY)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, primaryColor)));
            BigDecimal netSal = salary.getNetSalary() != null ? salary.getNetSalary() : BigDecimal.ZERO;
            Paragraph netVal = new Paragraph("LKR " + formatMoney(netSal), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, BaseColor.WHITE));
            netVal.setSpacingBefore(3);
            netLeft.addElement(netVal);
            String inWords = NumberToWords.convert(netSal.longValue()) + " Rupees Only";
            Paragraph netWords = new Paragraph("In Words: " + inWords, FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7, BaseColor.LIGHT_GRAY));
            netWords.setSpacingBefore(3);
            netLeft.addElement(netWords);
            netCardTable.addCell(netLeft);

            PdfPCell netRight = new PdfPCell();
            netRight.setBackgroundColor(darkNeutral);
            netRight.setBorderWidthLeft(1);
            netRight.setBorderColorLeft(new BaseColor(55, 65, 81));
            netRight.setBorderWidthTop(0);
            netRight.setBorderWidthRight(0);
            netRight.setBorderWidthBottom(0);
            netRight.setPadding(12);
            netRight.addElement(new Paragraph("CALCULATION", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6, mutedColor)));
            PdfPTable calcTable = new PdfPTable(2);
            calcTable.setWidthPercentage(100);
            calcTable.setSpacingBefore(3);
            addCalcRow(calcTable, "Total Earnings", formatMoney(salary.getTotalAllowances()), BaseColor.LIGHT_GRAY, BaseColor.WHITE);
            addCalcRow(calcTable, "Less Deductions", "-" + formatMoney(salary.getTotalDeductions()), BaseColor.LIGHT_GRAY, new BaseColor(248, 113, 113));
            PdfPCell lineCell = new PdfPCell();
            lineCell.setColspan(2);
            lineCell.setBorder(Rectangle.BOTTOM);
            lineCell.setBorderColor(new BaseColor(55,65,81));
            lineCell.setFixedHeight(5f);
            calcTable.addCell(lineCell);
            addCalcRow(calcTable, "Net Pay", formatMoney(netSal), primaryColor, primaryColor);
            netRight.addElement(calcTable);
            netCardTable.addCell(netRight);
            document.add(netCardTable);
            document.add(new Paragraph(" "));

            // 7. SUMMARY CARDS
            PdfPTable summaryCards = new PdfPTable(3);
            summaryCards.setWidthPercentage(100);
            addSummaryCard(summaryCards, "TOTAL EARNINGS", formatMoney(salary.getTotalAllowances()), textColor, lightNeutral, borderColor);
            addSummaryCard(summaryCards, "TOTAL DEDUCTIONS", formatMoney(salary.getTotalDeductions()), redDark, lightNeutral, borderColor);
            addSummaryCard(summaryCards, "NET PAY", formatMoney(netSal), primaryColor, lightNeutral, borderColor);
            document.add(summaryCards);
            document.add(new Paragraph(" "));

            // 8. FOOTER
            PdfPTable footerTable = new PdfPTable(2);
            footerTable.setWidthPercentage(100);
            footerTable.setSpacingBefore(10);
            PdfPCell noteCell = new PdfPCell();
            noteCell.setBorder(Rectangle.NO_BORDER);
            noteCell.addElement(new Paragraph("NOTES:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, textColor)));
            Font liFont = FontFactory.getFont(FontFactory.HELVETICA, 6, mutedColor);
            noteCell.addElement(new Paragraph("\u2022 This is a computer-generated payslip and does not require a physical signature.", liFont));
            noteCell.addElement(new Paragraph("\u2022 Please verify all details and report any discrepancies to HR immediately.", liFont));
            noteCell.addElement(new Paragraph("\u2022 EPF contributions are remitted as per statutory requirements.", liFont));
            footerTable.addCell(noteCell);

            PdfPCell sigCell = new PdfPCell();
            sigCell.setBorder(Rectangle.NO_BORDER);
            sigCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            sigCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            sigCell.setPaddingTop(15);
            Paragraph dLine = new Paragraph("----------------------------------------", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, mutedColor));
            dLine.setAlignment(Element.ALIGN_RIGHT);
            sigCell.addElement(dLine);
            Paragraph authSig = new Paragraph("AUTHORIZED SIGNATURE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, textColor));
            authSig.setAlignment(Element.ALIGN_RIGHT);
            sigCell.addElement(authSig);
            Paragraph finDept = new Paragraph("FINANCE DEPARTMENT", FontFactory.getFont(FontFactory.HELVETICA, 6, mutedColor));
            finDept.setAlignment(Element.ALIGN_RIGHT);
            sigCell.addElement(finDept);
            footerTable.addCell(sigCell);
            document.add(footerTable);

        } catch (Exception e) {
            System.err.println("PDF ERROR: " + e.toString());
            e.printStackTrace();
            throw new RuntimeException("Error during PDF generation: " + e.toString(), e);
        } finally {
            if (document != null && document.isOpen()) {
                document.close();
            }
        }
        byte[] bytes = out.toByteArray();
        System.out.println("Generated PDF size: " + bytes.length + " bytes");
        return bytes;
    }

    public void generateSalaryTrendsReport(SalaryTrendsDTO data, OutputStream out) {
        Document document = null;
        try {
            document = new Document(PageSize.A4.rotate(), 20, 20, 15, 15);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // UI Colors
            BaseColor darkNeutral = new BaseColor(23, 23, 23);
            BaseColor primaryColor = new BaseColor(250, 204, 21);
            BaseColor mutedColor = new BaseColor(107, 114, 128);
            BaseColor tealColor = new BaseColor(14, 116, 144); // #0E7490
            BaseColor lightNeutral = new BaseColor(249, 250, 251);
            BaseColor borderColor = new BaseColor(229, 231, 235);

            Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.WHITE);
            Font companySubFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, primaryColor);
            Font addressFont = FontFactory.getFont(FontFactory.HELVETICA, 7, mutedColor);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, darkNeutral);
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, mutedColor);

            Font statLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6, mutedColor);
            Font statValueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkNeutral);
            Font statSubFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6, mutedColor);

            // 1. HEADER (Reusable style)
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 2, 1 });
            PdfPCell leftHeader = new PdfPCell();
            leftHeader.setBackgroundColor(darkNeutral);
            leftHeader.setBorder(Rectangle.NO_BORDER);
            leftHeader.setPadding(15);
            PdfPTable logoContainer = new PdfPTable(2);
            logoContainer.setWidthPercentage(100);
            logoContainer.setWidths(new float[] { 1, 4 });
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            try {
                Image logo = Image.getInstance("frontend/src/assets/logo.png");
                logo.scaleToFit(35, 35);
                logoCell.addElement(logo);
            } catch (Exception e) {}
            logoContainer.addCell(logoCell);
            PdfPCell cNameCell = new PdfPCell();
            cNameCell.setBorder(Rectangle.NO_BORDER);
            cNameCell.addElement(new Paragraph("ACE FRONT LINE", companyFont));
            cNameCell.addElement(new Paragraph("SECURITY SOLUTIONS (PVT) LTD", companySubFont));
            cNameCell.addElement(new Paragraph("123 Main Street, Colombo 01, Sri Lanka", addressFont));
            logoContainer.addCell(cNameCell);
            leftHeader.addElement(logoContainer);
            PdfPCell rightHeader = new PdfPCell();
            rightHeader.setBackgroundColor(darkNeutral);
            rightHeader.setBorder(Rectangle.NO_BORDER);
            rightHeader.setPadding(15);
            rightHeader.addElement(new Paragraph("SALARY TRENDS REPORT", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE)));
            rightHeader.addElement(new Paragraph("Data Visualization & Analytics", FontFactory.getFont(FontFactory.HELVETICA, 7, primaryColor)));
            headerTable.addCell(leftHeader);
            headerTable.addCell(rightHeader);
            document.add(headerTable);
            document.add(new Paragraph(" "));

            // 2. PERIOD INFO
            String period = "All Time Records";
            if (data.getMonthlyTrends() != null && !data.getMonthlyTrends().isEmpty()) {
                period = data.getMonthlyTrends().get(0).getMonth() + " to " + data.getMonthlyTrends().get(data.getMonthlyTrends().size()-1).getMonth();
            }
            Paragraph pCenter = new Paragraph("REPORTING PERIOD: " + period.toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, mutedColor));
            pCenter.setAlignment(Element.ALIGN_CENTER);
            document.add(pCenter);
            document.add(new Paragraph(" "));

            // 3. SUMMARY CARDS (5-grid)
            PdfPTable summaryStats = new PdfPTable(5);
            summaryStats.setWidthPercentage(100);
            summaryStats.setSpacingAfter(15);
            addTrendStatCard(summaryStats, "AVERAGE", formatMoney(data.getAverageSalary()), "PER MONTH", primaryColor, statLabelFont, statValueFont, statSubFont);
            addTrendStatCard(summaryStats, "HIGHEST", formatMoney(data.getHighestSalary()), data.getHighestSalaryMonth(), primaryColor, statLabelFont, statValueFont, statSubFont);
            addTrendStatCard(summaryStats, "LOWEST", formatMoney(data.getLowestSalary()), data.getLowestSalaryMonth(), primaryColor, statLabelFont, statValueFont, statSubFont);
            addTrendStatCard(summaryStats, "TOTAL YTD", formatMoney(data.getTotalYTD()), "EARNINGS 2026", primaryColor, statLabelFont, statValueFont, statSubFont);
            addTrendStatCard(summaryStats, "OVERTIME", formatMoney(data.getTotalOvertime()), "AGGREGATED TOTAL", primaryColor, statLabelFont, statValueFont, statSubFont);
            document.add(summaryStats);

            // 4. MONTHLY NET SALARY TREND
            addUISectionHeader(document, "MONTHLY NET SALARY TREND", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, darkNeutral), tealColor);
            PdfPTable trendChart = new PdfPTable(1);
            trendChart.setWidthPercentage(100);
            PdfPCell trendCell = new PdfPCell();
            trendCell.setFixedHeight(180);
            trendCell.setBorder(Rectangle.NO_BORDER);
            if (data.getMonthlyTrends() != null) {
                trendCell.setCellEvent(new TrendAreaChartEvent(data.getMonthlyTrends(), tealColor));
            }
            trendChart.addCell(trendCell);
            document.add(trendChart);
            document.add(new Paragraph(" "));

            // 5. ALLOWANCES VS DEDUCTIONS (Page 2)
            document.newPage();
            addUISectionHeader(document, "ALLOWANCES VS DEDUCTIONS COMPARISON", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, darkNeutral), primaryColor);
            PdfPTable compChart = new PdfPTable(1);
            compChart.setWidthPercentage(100);
            PdfPCell compCell = new PdfPCell();
            compCell.setFixedHeight(180);
            compCell.setBorder(Rectangle.NO_BORDER);
            if (data.getMonthlyTrends() != null) {
                compCell.setCellEvent(new GroupedBarChartEvent(data.getMonthlyTrends()));
            }
            compChart.addCell(compCell);
            document.add(compChart);
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            // 6. PIE CHART BREAKDOWNS
            PdfPTable breakdownTable = new PdfPTable(2);
            breakdownTable.setSpacingBefore(10);
            breakdownTable.setWidthPercentage(100);
            breakdownTable.setWidths(new float[]{1, 1});

            // Allowances
            PdfPCell aCell = new PdfPCell();
            aCell.setBorder(Rectangle.NO_BORDER);
            aCell.setPaddingRight(10);
            aCell.addElement(new Paragraph("ALLOWANCE BREAKDOWN", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, darkNeutral)));
            PdfPTable aGrid = new PdfPTable(2);
            aGrid.setWidthPercentage(100);
            aGrid.setWidths(new float[]{1, 1.5f});
            PdfPCell aPie = new PdfPCell();
            aPie.setFixedHeight(180);
            aPie.setBorder(Rectangle.NO_BORDER);
            if (data.getAllowanceBreakdown() != null) aPie.setCellEvent(new PieChartEvent(data.getAllowanceBreakdown(), true));
            aGrid.addCell(aPie);
            PdfPCell aLegend = new PdfPCell();
            aLegend.setBorder(Rectangle.NO_BORDER);
            if (data.getAllowanceBreakdown() != null) {
                for (SalaryTrendsDTO.BreakdownItem item : data.getAllowanceBreakdown()) {
                    aLegend.addElement(createLegendItem(item.getLabel(), formatMoney(item.getAmount()), true));
                }
            }
            aGrid.addCell(aLegend);
            aCell.addElement(aGrid);
            breakdownTable.addCell(aCell);

            // Deductions
            PdfPCell dCell = new PdfPCell();
            dCell.setBorder(Rectangle.NO_BORDER);
            dCell.setPaddingLeft(10);
            dCell.addElement(new Paragraph("DEDUCTION BREAKDOWN", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, darkNeutral)));
            PdfPTable dGrid = new PdfPTable(2);
            dGrid.setWidthPercentage(100);
            dGrid.setWidths(new float[]{1, 1.5f});
            PdfPCell dPie = new PdfPCell();
            dPie.setFixedHeight(180);
            dPie.setBorder(Rectangle.NO_BORDER);
            if (data.getDeductionBreakdown() != null) dPie.setCellEvent(new PieChartEvent(data.getDeductionBreakdown(), false));
            dGrid.addCell(dPie);
            PdfPCell dLegend = new PdfPCell();
            dLegend.setBorder(Rectangle.NO_BORDER);
            if (data.getDeductionBreakdown() != null) {
                for (SalaryTrendsDTO.BreakdownItem item : data.getDeductionBreakdown()) {
                    dLegend.addElement(createLegendItem(item.getLabel(), formatMoney(item.getAmount()), false));
                }
            }
            dGrid.addCell(dLegend);
            dCell.addElement(dGrid);
            breakdownTable.addCell(dCell);

            document.add(breakdownTable);

            // 7. FOOTER
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("AFLSS ANALYTICS ENGINE \u2022 GENERATED ON " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6, mutedColor));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Salary Trends Report Error: " + e.getMessage());
        } finally {
            if (document != null && document.isOpen()) document.close();
        }
    }

    /**
     * Area Chart for Net Salary Trend (Replicating UI Look)
     */
    private static class TrendAreaChartEvent implements PdfPCellEvent {
        private final List<SalaryTrendsDTO.MonthTrend> data;
        private final BaseColor teal;

        public TrendAreaChartEvent(List<SalaryTrendsDTO.MonthTrend> data, BaseColor teal) {
            this.data = data;
            this.teal = teal;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle rect, PdfContentByte[] canvases) {
            PdfContentByte cb = canvases[PdfPTable.BACKGROUNDCANVAS];
            float margin = 40;
            float left = rect.getLeft() + margin;
            float bottom = rect.getBottom() + 15;
            float right = rect.getRight() - 20;
            float top = rect.getTop() - 10;
            float width = right - left;
            float height = top - bottom;

            if (data == null || data.isEmpty()) return;

            BigDecimal max = data.stream().map(SalaryTrendsDTO.MonthTrend::getAmount).reduce(BigDecimal.ZERO, BigDecimal::max);
            if (max.compareTo(BigDecimal.ZERO) == 0) max = BigDecimal.valueOf(100000);
            float maxVal = max.floatValue() * 1.25f;

            // 1. Grid Lines
            cb.setLineWidth(0.3f);
            cb.setColorStroke(new BaseColor(245, 245, 245));
            for (int i = 0; i <= 5; i++) {
                float y = bottom + (height * i / 5);
                cb.moveTo(left, y);
                cb.lineTo(right, y);
                cb.stroke();
            }

            float spacing = width / (data.size() > 1 ? data.size() - 1 : 1);
            if (data.size() == 1) spacing = width / 2;

            // 2. DRAW AREA (Fill)
            cb.saveState();
            cb.setGState(createGStateTransparent(cb));
            cb.setColorFill(new BaseColor(teal.getRed(), teal.getGreen(), teal.getBlue(), 40)); // Semi-transparent
            cb.moveTo(left, bottom);
            for (int i = 0; i < data.size(); i++) {
                float x = left + (spacing * i);
                float y = bottom + (data.get(i).getAmount().floatValue() / maxVal) * height;
                cb.lineTo(x, y);
            }
            cb.lineTo(left + (spacing * (data.size() - 1)), bottom);
            cb.fill();
            cb.restoreState();

            // 3. DRAW LINE (Stroke)
            cb.saveState();
            cb.setLineWidth(2.0f);
            cb.setColorStroke(teal);
            cb.setLineCap(PdfContentByte.LINE_CAP_ROUND);
            for (int i = 0; i < data.size(); i++) {
                float x = left + (spacing * i);
                float y = bottom + (data.get(i).getAmount().floatValue() / maxVal) * height;
                if (i == 0) cb.moveTo(x, y);
                else cb.lineTo(x, y);
            }
            cb.stroke();
            cb.restoreState();

            // 4. DRAW DOTS & LABELS
            for (int i = 0; i < data.size(); i++) {
                float x = left + (spacing * i);
                float y = bottom + (data.get(i).getAmount().floatValue() / maxVal) * height;

                cb.saveState();
                cb.setColorFill(BaseColor.WHITE);
                cb.setColorStroke(teal);
                cb.circle(x, y, 3);
                cb.fillStroke();
                cb.restoreState();

                // Month Label
                ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(data.get(i).getMonth(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7)), x, bottom - 12, 0);
            }
        }

        private PdfGState createGStateTransparent(PdfContentByte cb) {
            PdfGState gs = new PdfGState();
            gs.setFillOpacity(0.4f);
            return gs;
        }
    }

    /**
     * Grouped Vertical Bar Chart for Allowances vs Deductions
     */
    private static class GroupedBarChartEvent implements PdfPCellEvent {
        private final List<SalaryTrendsDTO.MonthTrend> data;

        public GroupedBarChartEvent(List<SalaryTrendsDTO.MonthTrend> data) {
            this.data = data;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle rect, PdfContentByte[] canvases) {
            PdfContentByte cb = canvases[PdfPTable.BACKGROUNDCANVAS];
            float margin = 30;
            float left = rect.getLeft() + margin;
            float bottom = rect.getBottom() + 15;
            float right = rect.getRight() - 60; // Space for legend
            float top = rect.getTop() - 10;
            float width = right - left;
            float height = top - bottom;

            if (data == null || data.isEmpty()) return;

            float maxVal = 0;
            for (SalaryTrendsDTO.MonthTrend t : data) {
                maxVal = Math.max(maxVal, t.getAllowances().floatValue());
                maxVal = Math.max(maxVal, t.getDeductions().floatValue());
            }
            maxVal = maxVal * 1.2f;
            if (maxVal == 0) maxVal = 100000;

            // Axis & Grid
            cb.setLineWidth(0.5f);
            cb.setColorStroke(new BaseColor(240, 240, 240));
            for (int i = 0; i <= 4; i++) {
                float y = bottom + (height * i / 4);
                cb.moveTo(left, y);
                cb.lineTo(right, y);
                cb.stroke();
            }

            float groupSpacing = (width / data.size());
            float barWidth = (groupSpacing * 0.4f);

            for (int i = 0; i < data.size(); i++) {
                SalaryTrendsDTO.MonthTrend trend = data.get(i);
                float x = left + (groupSpacing * i) + (groupSpacing - barWidth * 2) / 2;

                // Allowance Bar
                float hA = (trend.getAllowances().floatValue() / maxVal) * height;
                cb.saveState();
                cb.setColorFill(new BaseColor(220, 252, 231));
                cb.setColorStroke(new BaseColor(21, 128, 61));
                cb.roundRectangle(x, bottom, barWidth - 2, hA, 2);
                cb.fillStroke();
                cb.restoreState();

                // Deduction Bar
                float hD = (trend.getDeductions().floatValue() / maxVal) * height;
                cb.saveState();
                cb.setColorFill(new BaseColor(254, 226, 226));
                cb.setColorStroke(new BaseColor(185, 28, 28));
                cb.roundRectangle(x + barWidth, bottom, barWidth - 2, hD, 2);
                cb.fillStroke();
                cb.restoreState();

                // Label
                ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(trend.getMonth(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6, new BaseColor(23,23,23))), x + barWidth, bottom - 10, 0);
            }

            // Simple Legend on Right
            float lx = right + 10;
            float ly = top - 20;
            cb.saveState();
            // Allowances Marker
            cb.setColorFill(new BaseColor(220, 252, 231));
            cb.setColorStroke(new BaseColor(21, 128, 61));
            cb.rectangle(lx, ly, 8, 8);
            cb.fillStroke();
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase("Allowances", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, BaseColor.BLACK)), lx + 12, ly+1, 0);

            ly -= 14;
            // Deductions Marker
            cb.setColorFill(new BaseColor(254, 226, 226));
            cb.setColorStroke(new BaseColor(185, 28, 28));
            cb.rectangle(lx, ly, 8, 8);
            cb.fillStroke();
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase("Deductions", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, BaseColor.BLACK)), lx + 12, ly+1, 0);
            cb.restoreState();
        }
    }

    private static class PieChartEvent implements PdfPCellEvent {
        private final List<SalaryTrendsDTO.BreakdownItem> items;
        private final boolean isAllowance;

        public PieChartEvent(List<SalaryTrendsDTO.BreakdownItem> items, boolean isAllowance) {
            this.items = items;
            this.isAllowance = isAllowance;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle rect, PdfContentByte[] canvases) {
            PdfContentByte cb = canvases[PdfPTable.BACKGROUNDCANVAS];
            float centerX = (rect.getLeft() + rect.getRight()) / 2;
            float centerY = (rect.getBottom() + rect.getTop()) / 2;
            float radius = Math.min(rect.getWidth(), rect.getHeight()) / 2 - 5;

            BigDecimal total = items.stream().map(SalaryTrendsDTO.BreakdownItem::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (total.compareTo(BigDecimal.ZERO) == 0) return;

            float currentAngle = 0;
            for (int i = 0; i < items.size(); i++) {
                float angle = items.get(i).getAmount().floatValue() / total.floatValue() * 360;
                BaseColors c = getColorsForLabel(items.get(i).getLabel(), i);

                // Draw Fill
                cb.saveState();
                cb.setColorFill(c.fill);
                cb.moveTo(centerX, centerY);
                cb.arc(centerX - radius, centerY - radius, centerX + radius, centerY + radius, currentAngle, angle);
                cb.lineTo(centerX, centerY);
                cb.fill();
                cb.restoreState();

                // Draw Stroke
                cb.saveState();
                cb.setLineWidth(1.2f);
                cb.setColorStroke(c.stroke);
                cb.moveTo(centerX, centerY);
                cb.arc(centerX - radius, centerY - radius, centerX + radius, centerY + radius, currentAngle, angle);
                cb.lineTo(centerX, centerY);
                cb.stroke();
                cb.restoreState();

                currentAngle += angle;
            }

            cb.saveState();
            cb.setColorFill(BaseColor.WHITE);
            cb.circle(centerX, centerY, radius * 0.45f);
            cb.fill();
            cb.restoreState();
        }

        private static class BaseColors {
            BaseColor fill;
            BaseColor stroke;
            BaseColors(BaseColor f, BaseColor s) { this.fill = f; this.stroke = s; }
        }

        private BaseColors getColorsForLabel(String label, int idx) {
            String l = label.toLowerCase();
            if (isAllowance) {
                if (l.contains("basic")) return new BaseColors(new BaseColor(208, 233, 249), new BaseColor(21, 101, 192)); // #D0E9F9, #1565C0
                if (l.contains("ot") || l.contains("overtime")) return new BaseColors(new BaseColor(255, 227, 227), new BaseColor(198, 40, 40)); // #FFE3E3, #C62828
                if (l.contains("diri deemana")) return new BaseColors(new BaseColor(237, 248, 215), new BaseColor(46, 125, 50)); // #EDF8D7, #2E7D32
                return new BaseColors(new BaseColor(255, 236, 198), new BaseColor(255, 179, 0)); // #FFECC6, #FFB300
            } else {
                if (l.contains("epf")) return new BaseColors(new BaseColor(157, 166, 176), new BaseColor(69, 90, 100)); // #9DA6B0, #455A64
                if (l.contains("tax")) return new BaseColors(new BaseColor(176, 147, 123), new BaseColor(93, 64, 55)); // #B0937B, #5D4037
                if (l.contains("uniform")) return new BaseColors(new BaseColor(106, 113, 169), new BaseColor(48, 63, 159)); // #6A71A9, #303F9F
                if (l.contains("loan")) return new BaseColors(new BaseColor(173, 173, 181), new BaseColor(97, 97, 97)); // #ADADB5, #616161
                if (l.contains("advance")) return new BaseColors(new BaseColor(177, 176, 124), new BaseColor(104, 159, 56)); // #B1B07C, #689F38
                BaseColor[][] palette = {
                        { new BaseColor(243, 229, 245), new BaseColor(123, 31, 162) }, // #F3E5F5, #7B1FA2
                        { new BaseColor(224, 242, 241), new BaseColor(0, 121, 107) }, // #E0F2F1, #00796B
                        { new BaseColor(255, 243, 224), new BaseColor(230, 81, 0) } // #FFF3E0, #E65100
                };
                return new BaseColors(palette[idx % palette.length][0], palette[idx % palette.length][1]);
            }
        }
    }

    private void addTrendStatCard(PdfPTable table, String label, String value, String sub, BaseColor accent, Font lFont, Font vFont, Font sFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(6);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(new BaseColor(229, 231, 235));
        cell.setBorderWidthLeft(4);
        cell.setBorderColorLeft(accent);
        cell.setBackgroundColor(BaseColor.WHITE);

        Paragraph pLab = new Paragraph(label, lFont);
        pLab.setSpacingAfter(1);
        cell.addElement(pLab);

        Paragraph pVal = new Paragraph("LKR " + value.split("\\.")[0], vFont);
        pVal.setLeading(10);
        cell.addElement(pVal);

        Paragraph pSub = new Paragraph(sub != null ? sub.toUpperCase() : "N/A", sFont);
        pSub.setSpacingBefore(1);
        cell.addElement(pSub);

        table.addCell(cell);
    }

    private Phrase createLegendItem(String label, String amt, boolean isAllowance) {
        BaseColor c = isAllowance ? getAllowanceColor(label) : getDeductionColor(label);
        Phrase ph = new Phrase();
        // Colored Square Marker
        ph.add(new Chunk("\u25AA ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, c)));
        // Bold Label in same color as chart slice
        ph.add(new Chunk(label + ": ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, c)));
        // Muted Amount
        ph.add(new Chunk(amt, FontFactory.getFont(FontFactory.HELVETICA, 7, new BaseColor(107, 114, 128))));
        return ph;
    }

    private BaseColor getAllowanceColor(String label) {
        String l = label.toLowerCase();
        if (l.contains("basic")) return new BaseColor(21, 101, 192); // #1565C0
        if (l.contains("ot") || l.contains("overtime")) return new BaseColor(198, 40, 40); // #C62828
        if (l.contains("diri deemana")) return new BaseColor(46, 125, 50); // #2E7D32
        return new BaseColor(255, 179, 0); // #FFB300
    }

    private BaseColor getDeductionColor(String label) {
        String l = label.toLowerCase();
        if (l.contains("epf")) return new BaseColor(69, 90, 100); // #455A64
        if (l.contains("tax")) return new BaseColor(93, 64, 55); // #5D4037
        if (l.contains("uniform")) return new BaseColor(48, 63, 159); // #303F9F
        if (l.contains("loan")) return new BaseColor(97, 97, 97); // #616161
        if (l.contains("advance")) return new BaseColor(104, 159, 56); // #689F38
        return new BaseColor(123, 31, 162); // #7B1FA2
    }

    private void addStatCard(PdfPTable table, String label, String value, BaseColor color, Font lFont, Font vFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(8);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(new BaseColor(230, 230, 230));
        cell.setBackgroundColor(BaseColor.WHITE);
        cell.setBorderWidthLeft(3);
        cell.setBorderColorLeft(color);

        Paragraph pLabel = new Paragraph(label, lFont);
        pLabel.setSpacingAfter(2);
        cell.addElement(pLabel);

        Paragraph pValue = new Paragraph("Rs. " + value.split("\\.")[0], vFont); // Show int part for cleaner look in cards
        pValue.setLeading(12);
        cell.addElement(pValue);

        table.addCell(cell);
    }

    private void addSectionHeaderWithDesc(Document doc, String title, String desc, BaseColor titleColor, Font tFont,
                                          Font dFont) throws DocumentException {
        Paragraph t = new Paragraph(title, tFont);
        doc.add(t);
        Paragraph d = new Paragraph(desc, dFont);
        d.setSpacingAfter(4);
        doc.add(d);
        doc.add(new com.itextpdf.text.pdf.draw.LineSeparator(0.5f, 100f, new BaseColor(243, 244, 246),
                Element.ALIGN_CENTER, -2));
    }

    private void addStatBox(PdfPTable table, String label, String value, BaseColor color, Font lFont, Font vFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(10);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(new BaseColor(230, 230, 230));
        cell.setBackgroundColor(BaseColor.WHITE);

        Paragraph pLabel = new Paragraph(label, lFont);
        pLabel.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pLabel);

        Paragraph pValue = new Paragraph("Rs. " + value, vFont);
        pValue.setAlignment(Element.ALIGN_CENTER);
        pValue.setSpacingBefore(5);
        cell.addElement(pValue);

        table.addCell(cell);
    }

    private void addInfoCell(PdfPTable table, String label, String value, BaseColor bg) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setPadding(8);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(BaseColor.LIGHT_GRAY);

        Paragraph pLabel = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.GRAY));
        Paragraph pValue = new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.BLACK));

        cell.addElement(pLabel);
        cell.addElement(pValue);
        table.addCell(cell);
    }

    private void addDetailCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        cell.addElement(new Paragraph(label, labelFont));
        if (value == null)
            value = "-";
        cell.addElement(new Paragraph(value, valueFont));
        table.addCell(cell);
    }

    private void addSectionHeader(Document doc, String title, BaseColor color, Font font) throws DocumentException {
        Paragraph p = new Paragraph(title, font);
        p.setSpacingBefore(10);
        p.setSpacingAfter(2);
        doc.add(p);
        // Draw line
        // iText 5 doesn't have easy HR, but we can do a thin table or line separator
        doc.add(new com.itextpdf.text.pdf.draw.LineSeparator(1f, 100f, color, Element.ALIGN_CENTER, -2));
    }

    private void addRow(PdfPTable table, String desc, String amount, Font font, Font boldFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(desc, font));
        c1.setPadding(6);
        c1.setBorderColor(BaseColor.LIGHT_GRAY);

        PdfPCell c2 = new PdfPCell(new Phrase(amount, boldFont));
        c2.setPadding(6);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setBorderColor(BaseColor.LIGHT_GRAY);

        table.addCell(c1);
        table.addCell(c2);
    }

    private void addTotalRow(PdfPTable table, String label, String amount, BaseColor color) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, color)));
        c1.setPadding(8);
        c1.setBorder(Rectangle.TOP);
        c1.setBorderColor(color);

        PdfPCell c2 = new PdfPCell(new Phrase(amount, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, color)));
        c2.setPadding(8);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setBorder(Rectangle.TOP);
        c2.setBorderColor(color);

        table.addCell(c1);
        table.addCell(c2);
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null)
            return "0.00";
        DecimalFormat df = new DecimalFormat("#,###.00");
        return df.format(amount);
    }

    private void addUISectionHeader(Document doc, String title, Font font, BaseColor underlineColor) throws DocumentException {
        Paragraph p = new Paragraph(title, font);
        p.setSpacingBefore(8);
        doc.add(p);
        com.itextpdf.text.pdf.draw.LineSeparator ls = new com.itextpdf.text.pdf.draw.LineSeparator(2f, 20f, underlineColor, Element.ALIGN_LEFT, -2);
        doc.add(ls);
        doc.add(new Paragraph(" "));
    }

    private PdfPCell createMetaCell(String label, String value, BaseColor bg, BaseColor border) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setBorderColor(border);
        cell.setBorderWidth(1);
        cell.setPadding(6);
        Phrase ph = new Phrase();
        ph.add(new Chunk(label + " ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6, new BaseColor(107, 114, 128))));
        ph.add(new Chunk(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, new BaseColor(17, 24, 39))));
        cell.addElement(ph);
        return cell;
    }

    private void addGridCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingBottom(5);
        cell.addElement(new Paragraph(label, labelFont));
        Paragraph valP = new Paragraph(value != null ? value : "-", valueFont);
        valP.setSpacingBefore(1);
        cell.addElement(valP);
        table.addCell(cell);
    }

    private void addUIDetailRow(PdfPTable table, String desc, String amt, Font descFont, Font amtFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(desc, descFont));
        c1.setBorderColor(new BaseColor(229, 231, 235));
        c1.setBorderWidthLeft(1);
        c1.setBorderWidthRight(0);
        c1.setBorderWidthTop(0);
        c1.setBorderWidthBottom(1);
        c1.setPadding(6);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(amt, amtFont));
        c2.setBorderColor(new BaseColor(229, 231, 235));
        c2.setBorderWidthLeft(0);
        c2.setBorderWidthRight(1);
        c2.setBorderWidthTop(0);
        c2.setBorderWidthBottom(1);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(6);
        table.addCell(c2);
    }

    private void addUIBreakdownTotalRow(PdfPTable table, String label, String amt, BaseColor bg, BaseColor textCol) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, textCol);
        PdfPCell c1 = new PdfPCell(new Phrase(label, f));
        c1.setBackgroundColor(bg);
        c1.setBorderWidthLeft(1);
        c1.setBorderWidthRight(0);
        c1.setBorderWidthTop(0);
        c1.setBorderWidthBottom(1);
        c1.setBorderColor(new BaseColor(229, 231, 235));
        c1.setPadding(6);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(amt, f));
        c2.setBackgroundColor(bg);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setBorderWidthLeft(0);
        c2.setBorderWidthRight(1);
        c2.setBorderWidthTop(0);
        c2.setBorderWidthBottom(1);
        c2.setBorderColor(new BaseColor(229, 231, 235));
        c2.setPadding(6);
        table.addCell(c2);
    }

    private void addCalcRow(PdfPTable table, String label, String value, BaseColor labelColor, BaseColor valueColor) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, FontFactory.getFont(FontFactory.HELVETICA, 7, labelColor)));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPaddingTop(2);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, valueColor)));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPaddingTop(2);
        table.addCell(c2);
    }

    private void addSummaryCard(PdfPTable table, String label, String value, BaseColor valColor, BaseColor bg, BaseColor border) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setBorderColor(border);
        cell.setBorderWidth(1);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pLab = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6, new BaseColor(107, 114, 128)));
        pLab.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pLab);

        Paragraph pVal = new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, valColor));
        pVal.setAlignment(Element.ALIGN_CENTER);
        pVal.setSpacingBefore(2);
        cell.addElement(pVal);

        table.addCell(cell);
    }
}


