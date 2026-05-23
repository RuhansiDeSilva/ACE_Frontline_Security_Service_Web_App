package com.security.Ace.Front.Line.Security.Solutions.service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.security.Ace.Front.Line.Security.Solutions.dto.PredictionRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.PredictionResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.security.Ace.Front.Line.Security.Solutions.entity.BankDetails;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.entity.InvoiceItem;
import com.security.Ace.Front.Line.Security.Solutions.entity.Payment;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ItemType;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.VerificationStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.BankDetailsRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InvoiceItemRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InvoiceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
public class PdfService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PdfService.class);

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final BankDetailsRepository bankDetailsRepository;

    @Value("${app.brand.logo-path:/home/shishi/Documents/Ace-Front-Line-Security-Solutions/Ace-Front-Line-Security-Solutions/frontend/dist/assets/logo-Bdhrs9VM.png}")
    private String brandLogoPath;

    // ── Brand colours ─────────────────────────────────────────────────────────
    private static final BaseColor BRAND_YELLOW = new BaseColor(234, 179, 8);
    private static final BaseColor BRAND_DARK = new BaseColor(26, 26, 26);
    private static final BaseColor LIGHT_GREY = new BaseColor(249, 250, 251);
    private static final BaseColor BORDER_GREY = new BaseColor(229, 231, 235);
    private static final BaseColor TEXT_MUTED = new BaseColor(107, 114, 128);
    private static final BaseColor RED_ALERT = new BaseColor(220, 38, 38);
    private static final BaseColor GREEN_OK = new BaseColor(22, 163, 74);
    private static final BaseColor YELLOW_BG = new BaseColor(254, 252, 232);
    // ── Fonts ──────────────────────────────────────────────────────────────────
    private static final Font FONT_HEADER_BRAND = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD, BaseColor.WHITE);
    private static final Font FONT_HEADER_SUB = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL,
            new BaseColor(200, 200, 200));
    private static final Font FONT_INV_LABEL = new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, BRAND_YELLOW);
    private static final Font FONT_H3 = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BRAND_DARK);
    private static final Font FONT_NORMAL = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BRAND_DARK);
    private static final Font FONT_SMALL = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED);
    private static final Font FONT_BOLD = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BRAND_DARK);
    private static final Font FONT_LABEL = new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, TEXT_MUTED);
    private static final Font FONT_TABLE_H = new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, BaseColor.WHITE);
    private static final Font FONT_TOTAL = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BRAND_DARK);
    private static final Font FONT_YELLOW_BOLD = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BRAND_YELLOW);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy");
    private static final DateTimeFormatter DATE_FMT_SHORT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    // ── Public entry point ─────────────────────────────────────────────────────

    public byte[] generateInvoicePdf(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));
        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceInvoiceId(invoiceId);
        List<Payment> payments = paymentRepository.findByInvoiceInvoiceIdOrderByPaymentDateDesc(invoiceId);

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 45, 45, 45, 45);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            addHeader(doc, invoice);
            addClientInfoSection(doc, invoice);

            doc.add(Chunk.NEWLINE);
            addServiceTable(doc, invoice, items);

            doc.add(Chunk.NEWLINE);
            addTotalsBlock(doc, invoice);

            if (!payments.isEmpty()) {
                doc.add(Chunk.NEWLINE);
                addSectionTitle(doc, "Payment History");
                addPaymentsTable(doc, payments);
            }

            doc.add(Chunk.NEWLINE);
            addBankDetails(doc, invoice);

            addSignatureLine(doc, invoice);

            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF for invoice {}: {}", invoiceId, e.getMessage());
            throw new RuntimeException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    // ── RECEIPT: Public entry point ──────────────────────────────────────────

    public byte[] generateReceiptPdf(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        Invoice invoice = payment.getInvoice();

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 45, 45, 45, 45);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            addReceiptHeader(doc, payment);
            addClientInfoSection(doc, invoice); // Re-use client info block

            doc.add(Chunk.NEWLINE);
            addReceiptDetails(doc, payment);

            doc.add(Chunk.NEWLINE);
            // addBankDetails(doc, invoice); // Re-use bank details block

            addSignatureLine(doc, invoice); // Re-use signature line

            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF for receipt (payment {}): {}", paymentId, e.getMessage());
            throw new RuntimeException("Receipt PDF generation failed: " + e.getMessage(), e);
        }
    }

    // ── 1. Header ─────────────────────────────────────────────────────────────

    private void addHeader(Document doc, Invoice invoice) throws DocumentException {
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[] { 1.5f, 1f });
        header.setSpacingAfter(0);

        // ── Left: yellow logo badge + company info (white bg) ────────────────
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setBackgroundColor(BaseColor.WHITE);
        leftCell.setPadding(16);
        leftCell.setVerticalAlignment(Element.ALIGN_TOP);

        // Logo row: brand logo + company name
        PdfPTable logoRow = new PdfPTable(new float[] { 0.15f, 0.85f });
        logoRow.setWidthPercentage(100);
        logoRow.setSpacingAfter(8);

        Image logoImage = loadBrandLogo();
        if (logoImage != null) {
            logoImage.scaleToFit(30f, 30f);
            PdfPCell logoCell = new PdfPCell(logoImage, false);
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoCell.setPadding(0);
            logoRow.addCell(logoCell);
        } else {
            PdfPCell logoBadge = new PdfPCell(new Phrase("A",
                    new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BaseColor.BLACK)));
            logoBadge.setBackgroundColor(BRAND_YELLOW);
            logoBadge.setBorder(Rectangle.NO_BORDER);
            logoBadge.setHorizontalAlignment(Element.ALIGN_CENTER);
            logoBadge.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoBadge.setPaddingTop(5);
            logoBadge.setPaddingBottom(5);
            logoBadge.setPaddingLeft(4);
            logoBadge.setPaddingRight(4);
            logoRow.addCell(logoBadge);
        }

        PdfPCell nameCell = new PdfPCell();
        nameCell.setBorder(Rectangle.NO_BORDER);
        nameCell.setPaddingLeft(7);
        nameCell.setPaddingTop(0);
        nameCell.addElement(new Paragraph("ACE FRONT LINE",
                new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD, BRAND_DARK)));
        nameCell.addElement(new Paragraph("Security Solutions (PVT) Ltd",
                new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED)));
        logoRow.addCell(nameCell);

        leftCell.addElement(logoRow);

        Font addrFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED);
        leftCell.addElement(new Paragraph("189/2 Sandatenna Mawatha, Battaramulla", addrFont));
        leftCell.addElement(new Paragraph("Tel: 0114848177  |  acefrontlines@gmail.com", addrFont));
        leftCell.addElement(new Paragraph("VAT No: 101127788-7000", addrFont));

        // ── Right: INVOICE heading + meta (white bg) ─────────────────────────
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setBackgroundColor(BaseColor.WHITE);
        rightCell.setPadding(16);
        rightCell.setVerticalAlignment(Element.ALIGN_TOP);

        Paragraph invHead = new Paragraph("INVOICE",
                new Font(Font.FontFamily.HELVETICA, 26, Font.BOLD, BRAND_DARK));
        invHead.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(invHead);

        Paragraph invNumP = new Paragraph(
                invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "—",
                new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BRAND_DARK));
        invNumP.setAlignment(Element.ALIGN_RIGHT);
        invNumP.setSpacingBefore(2);
        rightCell.addElement(invNumP);

        rightCell.addElement(new Paragraph(" "));

        Paragraph dateLine = metaRow("DATE",
                invoice.getIssueDate() != null ? invoice.getIssueDate().format(DATE_FMT_SHORT) : "—", false);
        dateLine.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(dateLine);

        Paragraph vatLine = metaRow("VAT NUMBER", "101127788-7000", false);
        vatLine.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(vatLine);

        String statusText = invoice.getStatus().toString();
        Font sf = new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD,
                invoice.getStatus() == InvoiceStatus.PAID ? GREEN_OK
                        : invoice.getStatus() == InvoiceStatus.OVERDUE ? RED_ALERT : BRAND_DARK);
        Paragraph sp = new Paragraph(statusText, sf);
        sp.setAlignment(Element.ALIGN_RIGHT);
        sp.setSpacingBefore(4);
        rightCell.addElement(sp);

        header.addCell(leftCell);
        header.addCell(rightCell);
        doc.add(header);

        // Yellow accent rule below header
        PdfPTable sep = new PdfPTable(1);
        sep.setWidthPercentage(100);
        sep.setSpacingAfter(6);
        PdfPCell sepCell = new PdfPCell(new Phrase(" "));
        sepCell.setBorder(Rectangle.NO_BORDER);
        sepCell.setBackgroundColor(BRAND_YELLOW);
        sepCell.setFixedHeight(3f);
        sep.addCell(sepCell);
        doc.add(sep);
    }

    private Image loadBrandLogo() {
        try {
            if (brandLogoPath == null || brandLogoPath.isBlank()) {
                return null;
            }
            File logoFile = new File(brandLogoPath);
            if (!logoFile.exists()) {
                return null;
            }
            return Image.getInstance(logoFile.getAbsolutePath());
        } catch (Exception ex) {
            log.warn("Could not load brand logo for PDF header: {}", ex.getMessage());
            return null;
        }
    }

    // ── 2. Client info block ──────────────────────────────────────────────────

    private void addClientInfoSection(Document doc, Invoice invoice) throws DocumentException {
        Client c = invoice.getClient();

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1f, 1f });
        table.setSpacingBefore(12);

        // Left — client details
        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.BOX);
        left.setBorderColor(BORDER_GREY);
        left.setBackgroundColor(LIGHT_GREY);
        left.setPadding(12);

        Paragraph billTitle = new Paragraph("BILL TO", FONT_LABEL);
        billTitle.setSpacingAfter(6);
        left.addElement(billTitle);
        left.addElement(new Paragraph(c.getCompanyName(), FONT_H3));
        if (c.getAddress() != null && !c.getAddress().isBlank())
            left.addElement(new Paragraph(c.getAddress(), FONT_NORMAL));
        left.addElement(new Paragraph(" "));
        if (c.getServiceLocation() != null)
            left.addElement(labelValue("LOCATION", c.getServiceLocation()));
        if (c.getCity() != null && !c.getCity().isBlank())
            left.addElement(labelValue("ADDRESS", c.getCity()));
        if (c.getVatNumber() != null)
            left.addElement(labelValue("VAT NO", c.getVatNumber()));
        left.addElement(labelValue("CONTACT", c.getContactPersonName()
                + (c.getContactPersonPhone() != null ? "  |  " + c.getContactPersonPhone() : "")));

        // Right — invoice period details
        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.BOX);
        right.setBorderColor(BORDER_GREY);
        right.setPadding(12);

        Paragraph periodTitle = new Paragraph("SERVICE PERIOD", FONT_LABEL);
        periodTitle.setSpacingAfter(6);
        right.addElement(periodTitle);

        if (invoice.getPeriodFrom() != null && invoice.getPeriodTo() != null) {
            right.addElement(labelValue("PERIOD",
                    "From " + invoice.getPeriodFrom().format(DATE_FMT)
                            + " to " + invoice.getPeriodTo().format(DATE_FMT)));
        }
        right.addElement(labelValue("ISSUE DATE",
                invoice.getIssueDate() != null ? invoice.getIssueDate().format(DATE_FMT) : "—"));
        right.addElement(labelValue("DUE DATE",
                invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FMT) : "—"));
        right.addElement(labelValue("INVOICE TYPE",
                invoice.getInvoiceType() != null ? invoice.getInvoiceType().toString() : "AUTO"));
        if (invoice.getNotes() != null && !invoice.getNotes().isBlank())
            right.addElement(labelValue("NOTES", invoice.getNotes()));

        table.addCell(left);
        table.addCell(right);
        doc.add(table);
    }

    // ── 3. Service table — matches sample invoice exactly ─────────────────────
    //
    // RANK | STRENGTH | 12 HRS SHIFTS (NO OF SHIFTS | RATE Rs:) | OVER TIME (HRS |
    // RATE Rs:) | TOTAL Rs:
    // OIC | 2 | 62.00 | 2,871.93 | - | - | 178,059.66
    // JSO | 2 | 62.00 | 2,701.93 | - | - | 167,519.66
    // 345,579.32

    private void addServiceTable(Document doc, Invoice invoice, List<InvoiceItem> items) throws DocumentException {
        addSectionTitle(doc, "Service Details");

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 2f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f, 2f });
        table.setSpacingBefore(10);

        // Header row
        String[] headers = { "RANK", "STRENGTH", "SHIFTS", "RATE", "OT HRS", "OT RATE", "TOTAL" };
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FONT_TABLE_H));
            cell.setBackgroundColor(BRAND_DARK);
            cell.setPadding(7);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setBorderColor(BORDER_GREY);
            table.addCell(cell);
        }

        // Support for 4-Tier Model and Legacy OIC/JSO
        class RankData {
            String label;
            double strength = 0;
            double shifts = 0;
            double rate = 0;
            double otHrs = 0;
            double otRate = 0;
            double lineTotal = 0;

            RankData(String label, Integer strength) {
                this.label = label;
                this.strength = strength != null ? strength.doubleValue() : 0;
            }
        }

        RankData entryLevel = new RankData("Entry-level", invoice.getClient().getEntryLevelCount());
        RankData midLevel = new RankData("Mid-level", invoice.getClient().getMidLevelCount());
        RankData specialized = new RankData("Specialized", invoice.getClient().getSpecializedCount());
        RankData supervisor = new RankData("Supervisor", invoice.getClient().getSupervisorCount());

        // Legacy support
        RankData oicLegacy = new RankData("OIC", 0);
        RankData jsoLegacy = new RankData("JSO", 0);

        double otherTotal = 0;
        double deductionTotal = 0;

        for (InvoiceItem item : items) {
            double qty = item.getQuantity() != null ? item.getQuantity() : 0.0;
            double price = item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0.0;
            double total = item.getLineTotal() != null ? item.getLineTotal().doubleValue() : 0.0;

            switch (item.getItemType()) {
                case ENTRY_LEVEL_SERVICE:
                    entryLevel.shifts += qty;
                    entryLevel.rate = price;
                    entryLevel.lineTotal += total;
                    break;
                case ENTRY_LEVEL_OT:
                    entryLevel.otHrs += qty;
                    entryLevel.otRate = price;
                    entryLevel.lineTotal += total;
                    break;

                case MID_LEVEL_SERVICE:
                    midLevel.shifts += qty;
                    midLevel.rate = price;
                    midLevel.lineTotal += total;
                    break;
                case MID_LEVEL_OT:
                    midLevel.otHrs += qty;
                    midLevel.otRate = price;
                    midLevel.lineTotal += total;
                    break;

                case SPECIALIZED_SERVICE:
                    specialized.shifts += qty;
                    specialized.rate = price;
                    specialized.lineTotal += total;
                    break;
                case SPECIALIZED_OT:
                    specialized.otHrs += qty;
                    specialized.otRate = price;
                    specialized.lineTotal += total;
                    break;

                case SUPERVISOR_SERVICE:
                    supervisor.shifts += qty;
                    supervisor.rate = price;
                    supervisor.lineTotal += total;
                    break;
                case SUPERVISOR_OT:
                    supervisor.otHrs += qty;
                    supervisor.otRate = price;
                    supervisor.lineTotal += total;
                    break;

                case OVERTIME: // Legacy general OT
                    oicLegacy.otHrs += qty;
                    oicLegacy.otRate = price;
                    oicLegacy.lineTotal += total;
                    break;

                case OTHER_CHARGE:
                    otherTotal += total;
                    break;
                case DEDUCTION:
                    deductionTotal += total;
                    break;
                default:
                    break;
            }
        }

        // Add Rows for each rank that has either strength or activity
        RankData[] allRanks = { entryLevel, midLevel, specialized, supervisor, oicLegacy, jsoLegacy };
        boolean alt = true;
        double grandTotal = 0;

        for (RankData rd : allRanks) {
            if (rd.strength > 0 || rd.lineTotal > 0) {
                addServiceRow(table, rd.label, fmt(rd.strength, true),
                        rd.shifts > 0 ? fmt(rd.shifts, false) : "—",
                        rd.rate > 0 ? fmtCurr(rd.rate) : "—",
                        rd.otHrs > 0 ? fmt(rd.otHrs, false) : "—",
                        rd.otRate > 0 ? fmtCurr(rd.otRate) : "—",
                        fmtCurr(rd.lineTotal), alt ? LIGHT_GREY : BaseColor.WHITE);
                grandTotal += rd.lineTotal;
                alt = !alt;
            }
        }

        // Grand total row (spans all cols except last)
        PdfPCell emptySpan = new PdfPCell(new Phrase("SUBTOTAL", FONT_TABLE_H));
        emptySpan.setColspan(6);
        emptySpan.setBorder(Rectangle.TOP);
        emptySpan.setBorderColor(BORDER_GREY);
        emptySpan.setBackgroundColor(BRAND_DARK);
        emptySpan.setPadding(7);
        emptySpan.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(emptySpan);

        PdfPCell totalCell = new PdfPCell(new Phrase(fmtCurr(grandTotal), FONT_YELLOW_BOLD));
        totalCell.setBorder(Rectangle.TOP);
        totalCell.setBorderColor(BRAND_YELLOW);
        totalCell.setBackgroundColor(BRAND_DARK);
        totalCell.setPadding(7);
        totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(totalCell);

        doc.add(table);

        // Other charges / deductions as separate line items below
        boolean hasExtras = otherTotal > 0 || deductionTotal > 0;
        if (hasExtras) {
            doc.add(Chunk.NEWLINE);
            PdfPTable extras = new PdfPTable(2);
            extras.setWidthPercentage(100);
            extras.setWidths(new float[] { 3f, 1f });
            if (otherTotal > 0) {
                addExtrasRow(extras, "Others / Additional Charges", fmtCurr(otherTotal), false);
            }
            if (deductionTotal > 0) {
                addExtrasRow(extras, "Deductions", "(" + fmtCurr(deductionTotal) + ")", true);
            }
            doc.add(extras);
        }
    }

    // ── 4. Totals block — mirrors the sample invoice exactly ──────────────────

    private void addTotalsBlock(Document doc, Invoice invoice) throws DocumentException {
        PdfPTable totals = new PdfPTable(2);
        totals.setWidthPercentage(50);
        totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totals.setWidths(new float[] { 1.8f, 1f });

        addTotalDivider(totals);
        addTotalRow(totals, "INVOICE AMOUNT", "Rs:", fmt2(invoice.getInvoiceAmount()), false, false);

        // Others section (matches sample format)
        addOtherSection(totals, invoice);

        addTotalDivider(totals);
        addTotalRow(totals, "TOTAL", "Rs:", fmt2(invoice.getNetSubtotal() != null
                ? invoice.getInvoiceAmount()
                : BigDecimal.ZERO), false, false);
        addTotalRow(totals, "ADD 2.5% SSCL", "Rs:", fmt2(invoice.getSsclAmount()), false, false);
        addTotalRow(totals, "ADD 18% VAT", "Rs:", fmt2(invoice.getVatAmount()), false, false);

        if (Boolean.TRUE.equals(invoice.getLateFeeApplied())
                && invoice.getLateFee() != null
                && invoice.getLateFee().compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(totals, "LATE FEE (1.5%)", "Rs:", fmt2(invoice.getLateFee()), false, true);
        }

        addTotalDivider(totals);

        // TOTAL PAYABLE — highlighted
        PdfPCell tpLabel = styledCell("TOTAL PAYABLE", FONT_YELLOW_BOLD, BRAND_DARK, Element.ALIGN_LEFT);
        PdfPCell tpValue = styledCell("Rs:  " + fmt2(invoice.getTotalAmount()), FONT_YELLOW_BOLD, BRAND_DARK,
                Element.ALIGN_RIGHT);
        totals.addCell(tpLabel);
        totals.addCell(tpValue);

        addTotalDivider(totals);

        // Paid / Balance
        double balance = invoice.getBalanceAmount() != null ? invoice.getBalanceAmount().doubleValue() : 0;
        Font balFont = balance <= 0
                ? new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, GREEN_OK)
                : new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, RED_ALERT);
        BaseColor balBg = balance <= 0 ? new BaseColor(240, 253, 244) : new BaseColor(254, 242, 242);

        addTotalRow(totals, "Amount Paid (LKR)", "", fmt2(invoice.getPaidAmount()), false, false);

        PdfPCell blLabel = styledCell("Balance Due (LKR)", FONT_TOTAL, balBg, Element.ALIGN_LEFT);
        PdfPCell blValue = styledCell(fmt2(invoice.getBalanceAmount()), balFont, balBg, Element.ALIGN_RIGHT);
        totals.addCell(blLabel);
        totals.addCell(blValue);

        doc.add(totals);
    }

    // ── 5. Payments table ─────────────────────────────────────────────────────

    private void addPaymentsTable(Document doc, List<Payment> payments) throws DocumentException {
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1.5f, 1.6f, 1.8f, 1.4f, 1f });

        String[] headers = { "Date", "Bank / Method", "Reference", "Amount (LKR)", "Status" };
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FONT_TABLE_H));
            cell.setBackgroundColor(BRAND_DARK);
            cell.setPadding(7);
            cell.setBorder(Rectangle.NO_BORDER);
            table.addCell(cell);
        }

        boolean alt = false;
        for (Payment p : payments) {
            BaseColor bg = alt ? LIGHT_GREY : BaseColor.WHITE;
            addTableCell(table, p.getPaymentDate().format(DATE_FMT_SHORT), FONT_NORMAL, bg, Element.ALIGN_LEFT);

            String method = p.getPaymentMethod().toString().replace("_", " ");
            if (p.getBankName() != null && !p.getBankName().isBlank())
                method = p.getBankName() + " / " + method;
            addTableCell(table, method, FONT_SMALL, bg, Element.ALIGN_LEFT);
            addTableCell(table, p.getTransactionReference() != null ? p.getTransactionReference() : "—", FONT_SMALL, bg,
                    Element.ALIGN_LEFT);
            addTableCell(table, fmtCurr(p.getAmountPaid().doubleValue()), FONT_BOLD, bg, Element.ALIGN_RIGHT);

            Font sf = p.getVerificationStatus() == VerificationStatus.VERIFIED
                    ? new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, GREEN_OK)
                    : p.getVerificationStatus() == VerificationStatus.REJECTED
                            ? new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, RED_ALERT)
                            : FONT_SMALL;
            addTableCell(table, p.getVerificationStatus().toString(), sf, bg, Element.ALIGN_CENTER);
            alt = !alt;
        }
        doc.add(table);
    }

    // ── 6. Bank details — matching sample invoice format ──────────────────────

    private void addBankDetails(Document doc, Invoice invoice) throws DocumentException {
        String bankName = "Bank of Ceylon";
        String accountName = "Ace Front Line Security Solutions (PVT) Ltd";
        String accountNumber = "79289055";
        String branch = "Lake View Branch (612)";
        String bankCode = "7010";

        try {
            var bankOpt = bankDetailsRepository.findFirstByIsActiveTrueOrderByCreatedAtAsc();
            if (bankOpt.isPresent()) {
                BankDetails bd = bankOpt.get();
                bankName = bd.getBankName();
                accountName = bd.getAccountName();
                accountNumber = bd.getAccountNumber();
                branch = bd.getBranchName() + (bd.getBranchCode() != null ? " (" + bd.getBranchCode() + ")" : "");
                bankCode = bd.getBranchCode() != null ? bd.getBranchCode() : bankCode;
            }
        } catch (Exception e) {
            log.warn("Could not load bank details: {}", e.getMessage());
        }

        PdfPTable bank = new PdfPTable(1);
        bank.setWidthPercentage(100);

        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(BRAND_YELLOW);
        cell.setBackgroundColor(YELLOW_BG);
        cell.setPadding(14);

        Paragraph title = new Paragraph("Payment Instructions", FONT_H3);
        title.setSpacingAfter(8);
        cell.addElement(title);
        cell.addElement(labelValue("CREDIT TRANSFER",
                bankName + " (" + bankCode + ")  " + branch + " — " + accountNumber));
        cell.addElement(labelValue("CHEQUES IN FAVOR OF", "\"" + accountName + "\""));
        cell.addElement(new Paragraph(" "));
        Font noteFont = new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC, TEXT_MUTED);
        cell.addElement(new Paragraph(
                "Please use your Invoice Number (" + invoice.getInvoiceNumber() + ") as the payment reference "
                        + "and upload payment proof via the client portal within the due date.",
                noteFont));

        bank.addCell(cell);
        doc.add(bank);
    }

    // ── 7. Signature / date line ──────────────────────────────────────────────

    public byte[] generateRiskAssessmentPdf(PredictionRequestDTO request, PredictionResponseDTO response) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 45, 45, 45, 45);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            // 1. Branded Header
            addSimpleHeader(doc, "RISK ANALYSIS");

            // 2. Assessment Summary
            addAssessmentSummary(doc, request, response);

            doc.add(Chunk.NEWLINE);

            // 3. Site Profile Details
            addSiteProfileSection(doc, request);

            // 4. Recommendation Note
            addRecommendationNote(doc);

            // 5. Signature / Footer
            addSimpleFooter(doc);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate AI Risk Assessment PDF: {}", e.getMessage());
            throw new RuntimeException("AI Risk Assessment PDF generation failed", e);
        }
    }

    private void addSimpleHeader(Document doc, String title) throws DocumentException {
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[] { 1.5f, 1f });
        header.setSpacingAfter(0);

        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(16);

        PdfPTable logoRow = new PdfPTable(new float[] { 0.15f, 0.85f });
        logoRow.setWidthPercentage(100);
        Image logoImage = loadBrandLogo();
        if (logoImage != null) {
            logoImage.scaleToFit(30f, 30f);
            PdfPCell logoCell = new PdfPCell(logoImage, false);
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoRow.addCell(logoCell);
        } else {
            PdfPCell logoBadge = new PdfPCell(
                    new Phrase("A", new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.BLACK)));
            logoBadge.setBackgroundColor(BRAND_YELLOW);
            logoBadge.setBorder(Rectangle.NO_BORDER);
            logoBadge.setHorizontalAlignment(Element.ALIGN_CENTER);
            logoBadge.setPaddingTop(5);
            logoBadge.setPaddingBottom(5);
            logoRow.addCell(logoBadge);
        }

        PdfPCell nameCell = new PdfPCell();
        nameCell.setBorder(Rectangle.NO_BORDER);
        nameCell.setPaddingLeft(7);
        nameCell.addElement(
                new Paragraph("ACE FRONT LINE", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, BRAND_DARK)));
        nameCell.addElement(new Paragraph("Security Solutions (PVT) Ltd",
                new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED)));

        Font headerAddrFont = new Font(Font.FontFamily.HELVETICA, 7, Font.NORMAL, TEXT_MUTED);
        nameCell.addElement(new Paragraph("189/2 Sandatenna Mawatha, Battaramulla", headerAddrFont));
        nameCell.addElement(new Paragraph("Tel: 0114848177 | acefrontlines@gmail.com", headerAddrFont));
        logoRow.addCell(nameCell);
        leftCell.addElement(logoRow);

        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(16);
        Paragraph head = new Paragraph(title, new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, BRAND_DARK));
        head.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(head);
        Paragraph genDate = new Paragraph("Generated: " + java.time.LocalDate.now().format(DATE_FMT_SHORT),
                new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED));
        genDate.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(genDate);

        header.addCell(leftCell);
        header.addCell(rightCell);
        doc.add(header);

        PdfPTable sep = new PdfPTable(1);
        sep.setWidthPercentage(100);
        sep.setSpacingAfter(15);
        PdfPCell sepCell = new PdfPCell(new Phrase(" "));
        sepCell.setBorder(Rectangle.NO_BORDER);
        sepCell.setBackgroundColor(BRAND_YELLOW);
        sepCell.setFixedHeight(2f);
        sep.addCell(sepCell);
        doc.add(sep);
    }

    private void addAssessmentSummary(Document doc, PredictionRequestDTO request, PredictionResponseDTO response)
            throws DocumentException {
        // 1. Client Information Section (Professional left-aligned block)
        PdfPTable clientBox = new PdfPTable(1);
        clientBox.setWidthPercentage(100);
        clientBox.setSpacingAfter(20);

        PdfPCell clientLabel = new PdfPCell(
                new Phrase("PREPARED FOR", new Font(Font.FontFamily.HELVETICA, 7, Font.NORMAL, TEXT_MUTED)));
        clientLabel.setBorder(Rectangle.NO_BORDER);
        clientLabel.setPaddingLeft(0);
        clientBox.addCell(clientLabel);

        PdfPCell clientName = new PdfPCell(new Phrase(request.getCompanyName().toUpperCase(),
                new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, BRAND_DARK)));
        clientName.setBorder(Rectangle.NO_BORDER);
        clientName.setPaddingLeft(0);
        clientName.setPaddingBottom(5);
        clientBox.addCell(clientName);

        PdfPCell clientDetail = new PdfPCell(
                new Phrase(
                        request.getCompanyType() + " | " + request.getNearestCity() + " (" + request.getUrbanRural()
                                + ")",
                        new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BRAND_DARK)));
        clientDetail.setBorder(Rectangle.NO_BORDER);
        clientDetail.setPaddingLeft(0);
        clientBox.addCell(clientDetail);

        doc.add(clientBox);

        // 2. Assessment Result Dashboard (Unified premium highlight)
        PdfPTable dashboard = new PdfPTable(1);
        dashboard.setWidthPercentage(100);
        dashboard.setSpacingAfter(25);

        BaseColor riskColor = BRAND_DARK;
        if (response.getRiskLevel().equalsIgnoreCase("High"))
            riskColor = RED_ALERT;
        else if (response.getRiskLevel().equalsIgnoreCase("Medium"))
            riskColor = BRAND_YELLOW;
        else if (response.getRiskLevel().equalsIgnoreCase("Low"))
            riskColor = GREEN_OK;

        PdfPCell mainResultCell = new PdfPCell();
        mainResultCell.setBackgroundColor(BRAND_DARK);
        mainResultCell.setPadding(20);
        mainResultCell.setBorder(Rectangle.NO_BORDER);

        PdfPTable inner = new PdfPTable(2);
        inner.setWidthPercentage(100);
        inner.setWidths(new float[] { 1f, 1f });

        // Left Column: Risk Level
        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.addElement(new Paragraph("ASSESSED RISK LEVEL",
                new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, BaseColor.WHITE)));

        Paragraph lvl = new Paragraph(response.getRiskLevel().toUpperCase(),
                new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, riskColor));
        lvl.setSpacingBefore(8);
        left.addElement(lvl);
        inner.addCell(left);

        // Right Column: Officer Count
        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.addElement(
                new Paragraph("STRENGTH REQUIRED", new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, BaseColor.WHITE)));

        Paragraph count = new Paragraph(String.valueOf(response.getOfficerCount()) + " OFFICERS",
                new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, BRAND_YELLOW));
        count.setSpacingBefore(8);
        right.addElement(count);
        inner.addCell(right);

        mainResultCell.addElement(inner);
        dashboard.addCell(mainResultCell);

        doc.add(dashboard);
    }

    private void addSiteProfileSection(Document doc, PredictionRequestDTO req) throws DocumentException {
        addSectionTitle(doc, "Company Security Profile");

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        table.setSpacingAfter(10);

        addSiteDetail(table, "Company Type", req.getCompanyType());
        addSiteDetail(table, "Nearest Main City", req.getNearestCity());
        addSiteDetail(table, "Employee Count", String.valueOf(req.getEmployeeCount()));
        addSiteDetail(table, "Distance to City", req.getDistanceToCityKm() + " km");
        addSiteDetail(table, "CCTV Camera Count", String.valueOf(req.getCctvCount()));
        addSiteDetail(table, "Urban/Rural Area", req.getUrbanRural());
        addSiteDetail(table, "Night Operations", req.isNightActivity() ? "Yes" : "No");
        addSiteDetail(table, "Major Event Proximity", req.isMajorEventNearby() ? "Yes" : "No");
        addSiteDetail(table, "Cash Handling", req.isCashHandling() ? "Yes" : "No");

        doc.add(table);
    }

    private void addSiteDetail(PdfPTable table, String label, String value) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, FONT_BOLD));
        lCell.setBorder(Rectangle.BOTTOM);
        lCell.setBorderColor(BORDER_GREY);
        lCell.setPadding(5);
        table.addCell(lCell);

        PdfPCell vCell = new PdfPCell(new Phrase(value, FONT_NORMAL));
        vCell.setBorder(Rectangle.BOTTOM);
        vCell.setBorderColor(BORDER_GREY);
        vCell.setPadding(5);
        vCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(vCell);
    }

    private void addRecommendationNote(Document doc) throws DocumentException {
        Paragraph note = new Paragraph(
                "Note: This assessment is generated using security industry data models. For a comprehensive security plan and final staffing count, our team recommends an on-site security survey.",
                new Font(Font.FontFamily.HELVETICA, 9, Font.ITALIC, TEXT_MUTED));
        note.setSpacingBefore(15);
        note.setAlignment(Element.ALIGN_CENTER);
        doc.add(note);
    }

    private void addSimpleFooter(Document doc) throws DocumentException {
        doc.add(Chunk.NEWLINE);
        PdfPTable footer = new PdfPTable(1);
        footer.setWidthPercentage(100);
        PdfPCell fc = new PdfPCell();
        fc.setBorder(Rectangle.TOP);
        fc.setBorderColor(BORDER_GREY);
        fc.setPadding(10);
        Paragraph ft = new Paragraph(
                "Ace Front Line Security Solutions (PVT) Ltd  |  Tel: 0114848177\nThis is an AI-generated guidance report.",
                FONT_SMALL);
        ft.setAlignment(Element.ALIGN_CENTER);
        fc.addElement(ft);
        footer.addCell(fc);
        doc.add(footer);
    }

    private void addSignatureLine(Document doc, Invoice invoice) throws DocumentException {

        doc.add(Chunk.NEWLINE);

        PdfPTable sig = new PdfPTable(2);
        sig.setWidthPercentage(100);
        sig.setWidths(new float[] { 1f, 1f });

        // Issued date (right aligned matching sample)
        PdfPCell emptyCell = new PdfPCell(new Phrase("", FONT_NORMAL));
        emptyCell.setBorder(Rectangle.NO_BORDER);
        emptyCell.setPadding(6);
        sig.addCell(emptyCell);

        String issueDateStr = invoice.getIssueDate() != null ? invoice.getIssueDate().format(DATE_FMT)
                : java.time.LocalDate.now().format(DATE_FMT);
        Paragraph datePara = new Paragraph(issueDateStr, FONT_BOLD);
        datePara.setAlignment(Element.ALIGN_RIGHT);
        PdfPCell dateCell = new PdfPCell();
        dateCell.addElement(datePara);
        Paragraph dateLabel = new Paragraph("DATE", FONT_LABEL);
        dateLabel.setAlignment(Element.ALIGN_RIGHT);
        dateCell.addElement(dateLabel);
        dateCell.setBorder(Rectangle.TOP);
        dateCell.setBorderColor(BRAND_DARK);
        dateCell.setPaddingTop(6);
        dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        sig.addCell(dateCell);

        doc.add(sig);

        // Footer bar
        doc.add(Chunk.NEWLINE);
        PdfPTable footer = new PdfPTable(1);
        footer.setWidthPercentage(100);
        PdfPCell fc = new PdfPCell();
        fc.setBorder(Rectangle.TOP);
        fc.setBorderColor(BORDER_GREY);
        fc.setPadding(8);
        fc.setBackgroundColor(LIGHT_GREY);
        Paragraph ft = new Paragraph(
                "Ace Front Line Security Solutions (PVT) Ltd  |  189/2 Sandatenna Mawatha, Battaramulla  |  "
                        + "Tel: 0114848177  |  acefrontlines@gmail.com  |  VAT: 101127788-7000\n"
                        + "This is a computer-generated invoice. Generated on "
                        + java.time.LocalDate.now().format(DATE_FMT_SHORT),
                FONT_SMALL);
        ft.setAlignment(Element.ALIGN_CENTER);
        fc.addElement(ft);
        footer.addCell(fc);
        doc.add(footer);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private void addSectionTitle(Document doc, String title) throws DocumentException {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(title.toUpperCase(), FONT_TABLE_H));
        cell.setBackgroundColor(BRAND_DARK);
        cell.setPadding(8);
        cell.setBorder(Rectangle.NO_BORDER);
        t.addCell(cell);
        doc.add(t);
    }

    private void addSpanHeader(PdfPTable t, String text, int colspan, BaseColor bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_TABLE_H));
        cell.setColspan(colspan);
        cell.setBackgroundColor(bg);
        cell.setPadding(7);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        t.addCell(cell);
    }

    private PdfPCell spanCell(String text, int colspan, BaseColor bg, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setColspan(colspan);
        cell.setBackgroundColor(bg);
        cell.setPadding(7);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private void addServiceRow(PdfPTable t, String rank, String strength,
            String shifts, String rate, String otHrs, String otRate, String total, BaseColor bg) {
        Font rankFont = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BRAND_DARK);
        addTableCell(t, rank, rankFont, bg, Element.ALIGN_CENTER);
        addTableCell(t, strength, FONT_NORMAL, bg, Element.ALIGN_CENTER);
        addTableCell(t, shifts, FONT_NORMAL, bg, Element.ALIGN_CENTER);

        Font highlighted = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, new BaseColor(161, 96, 0));
        addTableCell(t, rate, highlighted, LIGHT_YELLOW, Element.ALIGN_RIGHT);
        addTableCell(t, otHrs, FONT_NORMAL, bg, Element.ALIGN_CENTER);
        addTableCell(t, otRate, highlighted, LIGHT_YELLOW, Element.ALIGN_RIGHT);
        addTableCell(t, total, FONT_BOLD, bg, Element.ALIGN_RIGHT);
    }

    private static final BaseColor LIGHT_YELLOW = new BaseColor(255, 251, 235);

    private void addExtrasRow(PdfPTable t, String label, String value, boolean red) {
        Font lf = FONT_NORMAL;
        Font vf = red ? new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, RED_ALERT) : FONT_BOLD;
        PdfPCell lc = new PdfPCell(new Phrase(label, lf));
        lc.setBorder(Rectangle.NO_BORDER);
        lc.setPadding(5);
        PdfPCell vc = new PdfPCell(new Phrase(value, vf));
        vc.setBorder(Rectangle.NO_BORDER);
        vc.setPadding(5);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(lc);
        t.addCell(vc);
    }

    private void addOtherSection(PdfPTable totals, Invoice invoice) {
        // "Others" section — matches sample invoice
        double others = invoice.getOtherCharges() != null ? invoice.getOtherCharges().doubleValue() : 0;
        double deductions = invoice.getDeductionsTotal() != null ? invoice.getDeductionsTotal().doubleValue() : 0;

        PdfPCell othLabel = new PdfPCell(new Phrase("Others", FONT_BOLD));
        othLabel.setBorder(Rectangle.NO_BORDER);
        othLabel.setPadding(5);
        PdfPCell othValue = new PdfPCell(new Phrase("", FONT_NORMAL));
        othValue.setBorder(Rectangle.NO_BORDER);
        othValue.setPadding(5);
        totals.addCell(othLabel);
        totals.addCell(othValue);

        addTotalRow(totals, "  ...................................", "Rs:", fmtCurr(others > 0 ? others : 0), false,
                false);
        if (deductions > 0) {
            addTotalRow(totals, "  Deductions", "Rs:", "(" + fmtCurr(deductions) + ")", false, true);
        }
    }

    private void addTotalDivider(PdfPTable table) {
        PdfPCell div = new PdfPCell();
        div.setColspan(2);
        div.setFixedHeight(1.5f);
        div.setBackgroundColor(BORDER_GREY);
        div.setBorder(Rectangle.NO_BORDER);
        table.addCell(div);
    }

    private void addTotalRow(PdfPTable table, String label, String prefix, String value,
            boolean highlight, boolean red) {
        Font lf = highlight ? FONT_TOTAL : FONT_NORMAL;
        Font vf = highlight ? FONT_YELLOW_BOLD
                : red ? new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, RED_ALERT) : FONT_BOLD;

        PdfPCell lc = new PdfPCell(new Phrase(label, lf));
        lc.setBorder(Rectangle.NO_BORDER);
        lc.setPadding(5);

        PdfPCell vc = new PdfPCell(new Phrase((prefix.isEmpty() ? "" : prefix + "  ") + value, vf));
        vc.setBorder(Rectangle.NO_BORDER);
        vc.setPadding(5);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);

        table.addCell(lc);
        table.addCell(vc);
    }

    private void addTableCell(PdfPTable table, String text, Font font,
            BaseColor bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "—", font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setBackgroundColor(bg);
        cell.setPadding(7);
        cell.setHorizontalAlignment(align);
        table.addCell(cell);
    }

    private PdfPCell styledCell(String text, Font font, BaseColor bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "—", font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setBackgroundColor(bg);
        cell.setPadding(8);
        cell.setHorizontalAlignment(align);
        return cell;
    }

    private Paragraph labelValue(String label, String value) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + ":  ", FONT_LABEL));
        p.add(new Chunk(value != null ? value : "—", FONT_NORMAL));
        p.setSpacingAfter(4);
        return p;
    }

    private Paragraph metaRow(String label, String value, boolean bold) {
        Font vf = bold ? new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BRAND_DARK) : FONT_NORMAL;
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " :  ", FONT_LABEL));
        p.add(new Chunk(value != null ? value : "—", vf));
        p.setAlignment(Element.ALIGN_RIGHT);
        p.setSpacingAfter(3);
        return p;
    }

    /** Format as integer if whole number, else 2 decimal places */
    private String fmt(double v, boolean integer) {
        return integer ? String.valueOf((int) v) : String.format("%.2f", v);
    }

    /** Format as comma-separated currency string */
    private String fmtCurr(double v) {
        return String.format("%,.2f", v);
    }

    /** Format BigDecimal as comma-separated currency */
    private String fmt2(BigDecimal value) {
        if (value == null)
            return "0.00";
        return String.format("%,.2f", value.doubleValue());
    }

    // ── RECEIPT: Header ───────────────────────────────────────────────────────

    private void addReceiptHeader(Document doc, Payment payment) throws DocumentException {
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[] { 1.5f, 1f });
        header.setSpacingAfter(0);

        // Left: Company Info
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setBackgroundColor(BaseColor.WHITE);
        leftCell.setPadding(16);
        leftCell.setVerticalAlignment(Element.ALIGN_TOP);

        PdfPTable logoRow = new PdfPTable(new float[] { 0.15f, 0.85f });
        logoRow.setWidthPercentage(100);
        logoRow.setSpacingAfter(8);
        Image logoImage = loadBrandLogo();
        if (logoImage != null) {
            logoImage.scaleToFit(30f, 30f);
            PdfPCell logoCell = new PdfPCell(logoImage, false);
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoCell.setPadding(0);
            logoRow.addCell(logoCell);
        }
        PdfPCell nameCell = new PdfPCell();
        nameCell.setBorder(Rectangle.NO_BORDER);
        nameCell.setPaddingLeft(7);
        nameCell.setPaddingTop(0);
        nameCell.addElement(
                new Paragraph("ACE FRONT LINE", new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD, BRAND_DARK)));
        nameCell.addElement(new Paragraph("Security Solutions (PVT) Ltd",
                new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED)));
        logoRow.addCell(nameCell);
        leftCell.addElement(logoRow);
        Font addrFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED);
        leftCell.addElement(new Paragraph("189/2 Sandatenna Mawatha, Battaramulla", addrFont));
        leftCell.addElement(new Paragraph("Tel: 0114848177  |  acefrontlines@gmail.com", addrFont));
        leftCell.addElement(new Paragraph("VAT No: 101127788-7000", addrFont));

        // Right: RECEIPT heading
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setBackgroundColor(BaseColor.WHITE);
        rightCell.setPadding(16);
        rightCell.setVerticalAlignment(Element.ALIGN_TOP);

        Paragraph receiptHead = new Paragraph("PAYMENT RECEIPT",
                new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, BRAND_DARK));
        receiptHead.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(receiptHead);

        Paragraph receiptNumP = new Paragraph("Receipt #" + payment.getPaymentId(),
                new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BRAND_DARK));
        receiptNumP.setAlignment(Element.ALIGN_RIGHT);
        receiptNumP.setSpacingBefore(2);
        rightCell.addElement(receiptNumP);

        rightCell.addElement(new Paragraph(" "));
        Paragraph dateLine = metaRow("DATE", payment.getPaymentDate().format(DATE_FMT_SHORT), false);
        dateLine.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(dateLine);

        Paragraph statusLine = metaRow("STATUS", "VERIFIED", true);
        statusLine.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(statusLine);

        header.addCell(leftCell);
        header.addCell(rightCell);
        doc.add(header);

        // Yellow accent rule below header
        PdfPTable sep = new PdfPTable(1);
        sep.setWidthPercentage(100);
        sep.setSpacingAfter(6);
        PdfPCell sepCell = new PdfPCell(new Phrase(" "));
        sepCell.setBorder(Rectangle.NO_BORDER);
        sepCell.setBackgroundColor(BRAND_YELLOW);
        sepCell.setFixedHeight(3f);
        sep.addCell(sepCell);
        doc.add(sep);
    }

    // ── RECEIPT: Details Table ────────────────────────────────────────────────

    private void addReceiptDetails(Document doc, Payment payment) throws DocumentException {
        addSectionTitle(doc, "Payment Details");

        PdfPTable detailsTable = new PdfPTable(2);
        detailsTable.setWidthPercentage(100);
        detailsTable.setWidths(new float[] { 1f, 2f });
        detailsTable.setSpacingAfter(12);

        // Amount Paid (highlighted)
        PdfPCell amountLabelCell = new PdfPCell(new Phrase("Amount Paid (LKR)", FONT_H3));
        amountLabelCell.setBorder(Rectangle.NO_BORDER);
        amountLabelCell.setBackgroundColor(LIGHT_GREY);
        amountLabelCell.setPadding(12);
        detailsTable.addCell(amountLabelCell);

        PdfPCell amountValueCell = new PdfPCell(new Phrase(fmt2(payment.getAmountPaid()),
                new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD, BRAND_DARK)));
        amountValueCell.setBorder(Rectangle.NO_BORDER);
        amountValueCell.setBackgroundColor(LIGHT_GREY);
        amountValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        amountValueCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        amountValueCell.setPadding(12);
        detailsTable.addCell(amountValueCell);

        doc.add(detailsTable);

        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[] { 1f, 1f });

        // Left column
        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.setPadding(0);
        left.addElement(labelValue("PAYMENT DATE", payment.getPaymentDate().format(DATE_FMT)));
        left.addElement(labelValue("PAYMENT METHOD", payment.getPaymentMethod().toString().replace("_", " ")));
        if (payment.getBankName() != null) {
            left.addElement(labelValue("BANK", payment.getBankName()));
        }
        if (payment.getTransactionReference() != null) {
            left.addElement(labelValue("TRANSACTION REF", payment.getTransactionReference()));
        }
        metaTable.addCell(left);

        // Right column
        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setPadding(0);
        right.addElement(labelValue("INVOICE #", payment.getInvoice().getInvoiceNumber()));
        right.addElement(labelValue("INVOICE DATE", payment.getInvoice().getIssueDate().format(DATE_FMT)));
        right.addElement(labelValue("INVOICE AMOUNT", "LKR " + fmt2(payment.getInvoice().getTotalAmount())));
        if (payment.getRemarks() != null && !payment.getRemarks().isBlank()) {
            right.addElement(labelValue("REMARKS", payment.getRemarks()));
        }
        metaTable.addCell(right);

        doc.add(metaTable);
    }
}
