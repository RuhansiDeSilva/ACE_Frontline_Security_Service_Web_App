package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.exception.FileStorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new FileStorageException("Could not create upload directory", ex);
        }
    }

    public String storeFile(MultipartFile file, String subFolder) {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Check if file has invalid characters
            if (originalFilename.contains("..")) {
                throw new FileStorageException("Invalid file path: " + originalFilename);
            }

            // Generate unique filename
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + fileExtension;

            // Create subfolder if needed
            Path targetLocation = this.fileStorageLocation.resolve(subFolder);
            Files.createDirectories(targetLocation);

            // Copy file to target location
            Path destinationFile = targetLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            return subFolder + "/" + newFilename;

        } catch (IOException ex) {
            throw new FileStorageException("Could not store file " + originalFilename, ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return resource;
            } else {
                throw new FileStorageException("File not found: " + fileName);
            }
        } catch (Exception ex) {
            throw new FileStorageException("File not found: " + fileName, ex);
        }
    }

    public void deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.error("Could not delete file: " + fileName, ex);
        }
    }
}