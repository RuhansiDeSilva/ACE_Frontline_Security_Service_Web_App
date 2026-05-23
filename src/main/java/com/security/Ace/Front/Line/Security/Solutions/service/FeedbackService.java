package com.security.Ace.Front.Line.Security.Solutions.service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itextpdf.text.BadElementException;
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
import com.security.Ace.Front.Line.Security.Solutions.dto.FeedbackResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.FeedbackSubmissionRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.ClientFeedback;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.FeedbackStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.DuplicateResourceException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientFeedbackRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final ClientFeedbackRepository feedbackRepository;
    private final ClientRepository clientRepository;

    @Value("${app.brand.logo-path:/home/shishi/Documents/Ace-Front-Line-Security-Solutions/Ace-Front-Line-Security-Solutions/frontend/dist/assets/logo-Bdhrs9VM.png}")
    private String brandLogoPath;

    @Transactional
    public FeedbackResponse submitFeedback(Integer clientId, FeedbackSubmissionRequest request) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();
        int currentYear  = now.getYear();

        // Enforce once-per-month rule — guide Phase 14
        feedbackRepository.findByClientClientIdAndSubmissionMonthAndSubmissionYear(
                clientId, currentMonth, currentYear).ifPresent(existing -> {
            throw new DuplicateResourceException(
                    "You have already submitted feedback for this month. One submission per month is allowed.");
        });

        ClientFeedback feedback = new ClientFeedback();
        feedback.setClient(client);
        feedback.setOverallRating(request.getOverallRating());
        feedback.setOfficerConductRating(request.getOfficerConductRating());
        feedback.setResponseTimeRating(request.getResponseTimeRating());
        feedback.setCommunicationRating(request.getCommunicationRating());
        feedback.setComments(request.getComments());
        feedback.setImprovements(request.getImprovements());
        feedback.setIsAnonymous(Boolean.TRUE.equals(request.getIsAnonymous()));
        feedback.setSubmissionMonth(currentMonth);
        feedback.setSubmissionYear(currentYear);
        feedback.setStatus(FeedbackStatus.PENDING);
        feedback.setIsApproved(false);
        feedback.setDisplayOnHomepage(false);
        feedback.setCreatedAt(LocalDateTime.now());

        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional
    public FeedbackResponse approveFeedback(Integer feedbackId, boolean displayOnHomepage) {
        ClientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        feedback.setStatus(FeedbackStatus.APPROVED);
        feedback.setIsApproved(true);
        // Only show on homepage if: non-anonymous (or anonymous consented) AND rating >= 4
        boolean canDisplay = displayOnHomepage
                && feedback.getOverallRating() != null
                && feedback.getOverallRating() >= 4;
        feedback.setDisplayOnHomepage(canDisplay);
        feedback.setReviewedAt(LocalDateTime.now());

        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional
    public FeedbackResponse rejectFeedback(Integer feedbackId, String adminResponse) {
        ClientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        feedback.setStatus(FeedbackStatus.REJECTED);
        feedback.setIsApproved(false);
        feedback.setDisplayOnHomepage(false);
        feedback.setAdminResponse(adminResponse);
        feedback.setReviewedAt(LocalDateTime.now());

        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional
    public FeedbackResponse flagFeedback(Integer feedbackId, String adminResponse) {
        ClientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        feedback.setStatus(FeedbackStatus.FLAGGED);
        feedback.setIsApproved(false);
        feedback.setDisplayOnHomepage(false);
        feedback.setAdminResponse(adminResponse);
        feedback.setReviewedAt(LocalDateTime.now());

        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getAllFeedback() {
        return feedbackRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getFeedbackById(Integer feedbackId) {
        return mapToResponse(feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId)));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedbackByClient(Integer clientId) {
        return feedbackRepository.findByClientClientIdOrderByCreatedAtDesc(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getPendingFeedback() {
        return feedbackRepository.findPendingReview()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getApprovedForHomepage() {
        // Guide Phase 16: top 6 only
        return feedbackRepository.findApprovedForHomepage()
                .stream().limit(6).map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Double getAverageRating() {
        Double avg = feedbackRepository.getOverallAverageRating();
        return avg != null ? avg : 0.0;
    }

    @Transactional
    public FeedbackResponse replyToFeedback(Integer feedbackId, String replyMessage) {
        ClientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        feedback.setAdminResponse(replyMessage);
        feedback.setReviewedAt(LocalDateTime.now());
        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getApprovedFeedback() {
        return feedbackRepository.findByIsApprovedTrueOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public byte[] generateFeedbackReportPdf() {
        List<ClientFeedback> all = feedbackRepository.findAll().stream()
                .sorted((a, b) -> {
                    LocalDateTime at = a.getCreatedAt();
                    LocalDateTime bt = b.getCreatedAt();
                    if (at == null && bt == null) return 0;
                    if (at == null) return 1;
                    if (bt == null) return -1;
                    return bt.compareTo(at);
                })
                .collect(Collectors.toList());

        // Keep feedback report branding consistent with invoice PDFs
        BaseColor BRAND_YELLOW = new BaseColor(234, 179, 8);
        BaseColor BRAND_DARK   = new BaseColor(26, 26, 26);
        BaseColor LIGHT_GREY   = new BaseColor(249, 250, 251);
        BaseColor BORDER_GREY  = new BaseColor(229, 231, 235);
        BaseColor TEXT_MUTED   = new BaseColor(107, 114, 128);

        Font fontH1        = new Font(Font.FontFamily.HELVETICA, 26, Font.BOLD, BRAND_DARK);
        Font fontCompany   = new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD, BRAND_DARK);
        Font fontCompanySub= new Font(Font.FontFamily.HELVETICA, 8,  Font.NORMAL, TEXT_MUTED);
        Font fontLabel     = new Font(Font.FontFamily.HELVETICA, 8,  Font.BOLD, TEXT_MUTED);
        Font fontNormal    = new Font(Font.FontFamily.HELVETICA, 8,  Font.NORMAL, BRAND_DARK);
        Font fontSmallMuted= new Font(Font.FontFamily.HELVETICA, 7,  Font.NORMAL, TEXT_MUTED);
        Font fontTableH    = new Font(Font.FontFamily.HELVETICA, 7,  Font.BOLD, BaseColor.WHITE);
        Font fontCell      = new Font(Font.FontFamily.HELVETICA, 7,  Font.NORMAL, BRAND_DARK);
        Font fontSection   = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BRAND_DARK);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");
        DateTimeFormatter mf  = DateTimeFormatter.ofPattern("MMM yyyy");
        LocalDateTime generatedAt = LocalDateTime.now();

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Standard header (same style as invoice PDFs) ─────────────────
            PdfPTable header = new PdfPTable(2);
            header.setWidthPercentage(100);
            header.setWidths(new float[]{1.5f, 1f});
            header.setSpacingAfter(0);

            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.setBackgroundColor(BaseColor.WHITE);
            leftCell.setPadding(16);
            leftCell.setVerticalAlignment(Element.ALIGN_TOP);

            PdfPTable logoRow = new PdfPTable(new float[]{0.15f, 0.85f});
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
            nameCell.addElement(new Paragraph("ACE FRONT LINE", fontCompany));
            nameCell.addElement(new Paragraph("Security Solutions (PVT) Ltd", fontCompanySub));
            logoRow.addCell(nameCell);
            leftCell.addElement(logoRow);

            Font addrFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED);
            leftCell.addElement(new Paragraph("189/2 Sandatenna Mawatha, Battaramulla", addrFont));
            leftCell.addElement(new Paragraph("Tel: 0114848177  |  acefrontlines@gmail.com", addrFont));
            leftCell.addElement(new Paragraph("VAT No: 101127788-7000", addrFont));

            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setBackgroundColor(BaseColor.WHITE);
            rightCell.setPadding(16);
            rightCell.setVerticalAlignment(Element.ALIGN_TOP);

            Paragraph title = new Paragraph("FEEDBACK REPORT", fontH1);
            title.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(title);

            Paragraph gen = metaRow("GENERATED", generatedAt.format(dtf), fontLabel, fontNormal);
            gen.setAlignment(Element.ALIGN_RIGHT);
            gen.setSpacingBefore(6);
            rightCell.addElement(gen);

            header.addCell(leftCell);
            header.addCell(rightCell);
            doc.add(header);

            PdfPTable sep = new PdfPTable(1);
            sep.setWidthPercentage(100);
            sep.setSpacingAfter(10);
            PdfPCell sepCell = new PdfPCell(new Phrase(" "));
            sepCell.setBorder(Rectangle.NO_BORDER);
            sepCell.setBackgroundColor(BRAND_YELLOW);
            sepCell.setFixedHeight(3f);
            sep.addCell(sepCell);
            doc.add(sep);

            // ── Summary stats ────────────────────────────────────────────────
            long total    = all.size();
            long pending  = all.stream().filter(f -> f.getStatus() == FeedbackStatus.PENDING).count();
            long approved = all.stream().filter(f -> f.getStatus() == FeedbackStatus.APPROVED).count();
            long rejected = all.stream().filter(f -> f.getStatus() == FeedbackStatus.REJECTED).count();
            long flagged  = all.stream().filter(f -> f.getStatus() == FeedbackStatus.FLAGGED).count();
            double avgRating = all.stream().filter(f -> f.getOverallRating() != null)
                    .mapToInt(ClientFeedback::getOverallRating).average().orElse(0);

            PdfPTable statsTable = new PdfPTable(6);
            statsTable.setWidthPercentage(100);
            statsTable.setSpacingAfter(12);
            for (String[] s : new String[][]{
                    {"Total", String.valueOf(total)},
                    {"Pending", String.valueOf(pending)},
                    {"Approved", String.valueOf(approved)},
                    {"Rejected", String.valueOf(rejected)},
                    {"Flagged", String.valueOf(flagged)},
                    {"Avg Rating", String.format("%.1f / 5", avgRating)},
            }) {
                PdfPCell sc = new PdfPCell();
                sc.setBorder(Rectangle.BOX);
                sc.setBorderColor(BORDER_GREY);
                sc.setBackgroundColor(LIGHT_GREY);
                sc.setPadding(8);
                sc.setHorizontalAlignment(Element.ALIGN_CENTER);
                Font valFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, BRAND_DARK);
                sc.addElement(new Phrase(s[1], valFont));
                sc.addElement(new Phrase(s[0], fontSmallMuted));
                statsTable.addCell(sc);
            }
            doc.add(statsTable);

            // ── Feedback table ───────────────────────────────────────────────
            Paragraph sectionTitle = new Paragraph("All Feedback Records", fontSection);
            sectionTitle.setSpacingAfter(6);
            doc.add(sectionTitle);

            PdfPTable table = new PdfPTable(14);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.6f, 2.0f, 0.8f, 0.9f, 0.9f, 0.9f, 0.9f, 1.1f, 2.7f, 2.4f, 2.2f, 1.0f, 1.2f, 1.2f});

            for (String h : new String[]{
                    "#", "Company", "Anon", "Overall", "Officer", "Response", "Comms", "Month",
                    "Comments", "Improvements", "Admin Response", "Status", "Submitted", "Reviewed"
            }) {
                PdfPCell hc = new PdfPCell(new Phrase(h, fontTableH));
                hc.setBackgroundColor(BRAND_DARK);
                hc.setBorder(Rectangle.BOX);
                hc.setBorderColor(BORDER_GREY);
                hc.setPadding(6);
                table.addCell(hc);
            }

            int rowNum = 1;
            for (ClientFeedback f : all) {
                BaseColor bg = (rowNum % 2 == 0) ? LIGHT_GREY : BaseColor.WHITE;
                String period = (f.getSubmissionMonth() != null && f.getSubmissionYear() != null)
                        ? LocalDate.of(f.getSubmissionYear(), f.getSubmissionMonth(), 1).format(mf)
                        : (f.getCreatedAt() != null ? f.getCreatedAt().toLocalDate().format(mf) : "-");
                String name   = Boolean.TRUE.equals(f.getIsAnonymous()) ? "Anonymous"
                        : (f.getClient() != null ? f.getClient().getCompanyName() : "-");
                String commentSnippet = snippet(f.getComments(), 120);
                String improvementsSnippet = snippet(f.getImprovements(), 120);
                String adminRespSnippet = snippet(f.getAdminResponse(), 120);
                for (String val : new String[]{
                        String.valueOf(rowNum),
                        safe(name),
                        Boolean.TRUE.equals(f.getIsAnonymous()) ? "Yes" : "No",
                        ratingShort(f.getOverallRating()),
                        ratingShort(f.getOfficerConductRating()),
                        ratingShort(f.getResponseTimeRating()),
                        ratingShort(f.getCommunicationRating()),
                        safe(period),
                        safe(commentSnippet),
                        safe(improvementsSnippet),
                        safe(adminRespSnippet),
                        f.getStatus() != null ? f.getStatus().toString() : "-",
                        f.getCreatedAt() != null ? f.getCreatedAt().format(dtf) : "-",
                        f.getReviewedAt() != null ? f.getReviewedAt().format(dtf) : "-"
                }) {
                    PdfPCell tc = new PdfPCell(new Phrase(val, fontCell));
                    tc.setBackgroundColor(bg);
                    tc.setBorder(Rectangle.BOX);
                    tc.setBorderColor(BORDER_GREY);
                    tc.setPadding(6);
                    table.addCell(tc);
                }
                rowNum++;
            }
            doc.add(table);

            // ── Detailed section (full, un-truncated text) ───────────────────
            doc.newPage();
            Paragraph detailsTitle = new Paragraph("Detailed Feedback Entries", fontSection);
            detailsTitle.setSpacingAfter(8);
            doc.add(detailsTitle);

            int idx = 1;
            for (ClientFeedback f : all) {
                String company = Boolean.TRUE.equals(f.getIsAnonymous())
                        ? "Anonymous"
                        : (f.getClient() != null ? f.getClient().getCompanyName() : "-");
                String period = (f.getSubmissionMonth() != null && f.getSubmissionYear() != null)
                        ? LocalDate.of(f.getSubmissionYear(), f.getSubmissionMonth(), 1).format(mf)
                        : (f.getCreatedAt() != null ? f.getCreatedAt().toLocalDate().format(mf) : "-");
                String status = f.getStatus() != null ? f.getStatus().toString() : "-";

                PdfPTable card = new PdfPTable(2);
                card.setWidthPercentage(100);
                card.setWidths(new float[]{1.1f, 2.9f});
                card.setSpacingBefore(6);
                card.setSpacingAfter(10);

                PdfPCell head = new PdfPCell(new Phrase(
                        "#" + idx + "  •  " + company + "  •  " + period + "  •  " + status,
                        new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BRAND_DARK)));
                head.setColspan(2);
                head.setBackgroundColor(LIGHT_GREY);
                head.setBorder(Rectangle.BOX);
                head.setBorderColor(BORDER_GREY);
                head.setPadding(8);
                card.addCell(head);

                addKV(card, "Overall", ratingLong(f.getOverallRating()), fontLabel, fontNormal, BORDER_GREY);
                addKV(card, "Officer Conduct", ratingLong(f.getOfficerConductRating()), fontLabel, fontNormal, BORDER_GREY);
                addKV(card, "Response Time", ratingLong(f.getResponseTimeRating()), fontLabel, fontNormal, BORDER_GREY);
                addKV(card, "Communication", ratingLong(f.getCommunicationRating()), fontLabel, fontNormal, BORDER_GREY);
                addKV(card, "Submitted", f.getCreatedAt() != null ? f.getCreatedAt().format(dtf) : "-", fontLabel, fontNormal, BORDER_GREY);
                addKV(card, "Reviewed", f.getReviewedAt() != null ? f.getReviewedAt().format(dtf) : "-", fontLabel, fontNormal, BORDER_GREY);

                addKV(card, "Comments", safeLong(f.getComments()), fontLabel, fontNormal, BORDER_GREY);
                addKV(card, "Improvements", safeLong(f.getImprovements()), fontLabel, fontNormal, BORDER_GREY);
                addKV(card, "Admin Response", safeLong(f.getAdminResponse()), fontLabel, fontNormal, BORDER_GREY);

                doc.add(card);
                idx++;
            }

            doc.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new RuntimeException("Failed to generate feedback report PDF: " + e.getMessage(), e);
        }
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
        } catch (BadElementException | IOException ex) {
            return null;
        }
    }

    private Paragraph metaRow(String label, String value, Font labelFont, Font valueFont) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + ": ", labelFont));
        p.add(new Chunk(value != null ? value : "-", valueFont));
        return p;
    }

    private void addKV(PdfPTable table, String key, String value, Font keyFont, Font valueFont, BaseColor border) {
        PdfPCell k = new PdfPCell(new Phrase(key, keyFont));
        k.setBorder(Rectangle.BOX);
        k.setBorderColor(border);
        k.setPadding(7);
        k.setVerticalAlignment(Element.ALIGN_TOP);
        table.addCell(k);

        PdfPCell v = new PdfPCell(new Phrase(value != null && !value.isBlank() ? value : "-", valueFont));
        v.setBorder(Rectangle.BOX);
        v.setBorderColor(border);
        v.setPadding(7);
        v.setVerticalAlignment(Element.ALIGN_TOP);
        table.addCell(v);
    }

    private String safe(String s) {
        return (s == null || s.isBlank()) ? "-" : s;
    }

    private String safeLong(String s) {
        return (s == null || s.isBlank()) ? "-" : s;
    }

    private String snippet(String s, int maxChars) {
        if (s == null || s.isBlank()) return "-";
        String trimmed = s.trim().replaceAll("\\s+", " ");
        if (trimmed.length() <= maxChars) return trimmed;
        return trimmed.substring(0, Math.max(0, maxChars - 1)) + "…";
    }

    private String ratingShort(Integer rating) {
        if (rating == null) return "-";
        return rating + "/5";
    }

    private String ratingLong(Integer rating) {
        if (rating == null) return "-";
        return stars(rating);
    }

    private String stars(Integer rating) {
        if (rating == null) return "-";
        return "\u2605".repeat(rating) + "\u2606".repeat(5 - rating) + " (" + rating + ")";
    }

    private FeedbackResponse mapToResponse(ClientFeedback f) {
        FeedbackResponse r = new FeedbackResponse();
        r.setFeedbackId(f.getFeedbackId());
        r.setClientId(f.getClient().getClientId());
        // Hide company name if anonymous — guide Phase 16
        r.setCompanyName(Boolean.TRUE.equals(f.getIsAnonymous()) ? "Anonymous" : f.getClient().getCompanyName());
        r.setOverallRating(f.getOverallRating());
        r.setOfficerConductRating(f.getOfficerConductRating());
        r.setResponseTimeRating(f.getResponseTimeRating());
        r.setCommunicationRating(f.getCommunicationRating());
        r.setComments(f.getComments());
        r.setImprovements(f.getImprovements());
        r.setIsAnonymous(f.getIsAnonymous());
        r.setSubmissionMonth(f.getSubmissionMonth());
        r.setSubmissionYear(f.getSubmissionYear());
        r.setStatus(f.getStatus().toString());
        r.setIsApproved(f.getIsApproved());
        r.setDisplayOnHomepage(f.getDisplayOnHomepage());
        r.setAdminResponse(f.getAdminResponse());
        r.setCreatedAt(f.getCreatedAt());
        r.setReviewedAt(f.getReviewedAt());
        return r;
    }
}