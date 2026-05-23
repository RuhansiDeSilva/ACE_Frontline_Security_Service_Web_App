package com.security.Ace.Front.Line.Security.Solutions.util;

import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class FileUploadUtil {

    private static final String UPLOAD_DIR = "uploads/";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_CV_EXTENSIONS = new HashSet<>(Arrays.asList("pdf", "doc", "docx"));
    private static final Set<String> ALLOWED_CERT_EXTENSIONS = new HashSet<>(Arrays.asList("pdf", "jpg", "png", "jpeg"));

    public static String uploadCVFile(MultipartFile file) throws FileUploadException {
        try {
            validateFile(file, ALLOWED_CV_EXTENSIONS);
            return saveFile(file, "cv");
        } catch (IOException e) {
            throw new FileUploadException("Failed to upload CV file: " + e.getMessage(), e);
        }
    }

    public static String uploadCertificateFile(MultipartFile file) throws FileUploadException {
        try {
            validateFile(file, ALLOWED_CERT_EXTENSIONS);
            return saveFile(file, "certificate");
        } catch (IOException e) {
            throw new FileUploadException("Failed to upload certificate file: " + e.getMessage(), e);
        }
    }

    private static void validateFile(MultipartFile file, Set<String> allowedExtensions) throws FileUploadException {
        if (file.isEmpty()) {
            throw new FileUploadException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileUploadException("File size exceeds maximum allowed size of 10 MB");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            throw new FileUploadException("Invalid file name");
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        if (!allowedExtensions.contains(extension)) {
            throw new FileUploadException("File type not allowed. Allowed types: " + String.join(", ", allowedExtensions));
        }
    }

    private static String saveFile(MultipartFile file, String fileType) throws IOException {
        String uploadDir = UPLOAD_DIR + fileType + "/";
        File uploadFolder = new File(uploadDir);

        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String uniqueFileName = generateUniqueFileName() + fileExtension;
        String filePath = uploadDir + uniqueFileName;

        Path path = Paths.get(filePath);
        Files.write(path, file.getBytes());

        return filePath;
    }

    private static String generateUniqueFileName() {
        SecureRandom random = new SecureRandom();
        long timestamp = System.currentTimeMillis();
        int randomNum = random.nextInt(10000);
        return timestamp + "_" + randomNum;
    }

    public static void deleteFile(String filePath) {
        try {
            if (filePath != null && !filePath.isEmpty()) {
                Path path = Paths.get(filePath);
                Files.deleteIfExists(path);
            }
        } catch (IOException e) {
            System.err.println("Failed to delete file: " + e.getMessage());
        }
    }
}
