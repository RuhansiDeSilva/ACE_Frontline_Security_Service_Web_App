package com.security.Ace.Front.Line.Security.Solutions.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.ChangePasswordRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientForgotPasswordRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientLoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientLoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.ForgotPasswordRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.RegisterUserRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ResetPasswordRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.UpdatePersonalInfoRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.UserProfileResponse;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import com.security.Ace.Front.Line.Security.Solutions.service.ClientAuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService staffAuthService;  // Staff login

    @Autowired
    private ClientAuthService clientAuthService;  // Client login

    @GetMapping("/network-config")
    public ResponseEntity<?> getNetworkConfig() {
        try {
            java.util.Map<String, String> data = new java.util.HashMap<>();
            java.net.InetAddress inetAddress = java.net.InetAddress.getLocalHost();
            data.put("localIp", inetAddress.getHostAddress());
            return ResponseEntity.ok(ApiResponse.success("Network config retrieved", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/staff/login")
    public ResponseEntity<?> staffLogin(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = staffAuthService.login(loginRequest);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    // Backward-compatible endpoint used by frontend pages
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        return staffLogin(loginRequest);
    }

    @PostMapping("/client/login")
    public ResponseEntity<?> clientLogin(@RequestBody ClientLoginRequest loginRequest) {
        try {
            ClientLoginResponse response = clientAuthService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/client/forgot-password")
    public ResponseEntity<?> clientForgotPassword(@RequestBody ClientForgotPasswordRequest request) {
        try {
            clientAuthService.sendTemporaryPassword(request.getUsername());
            return ResponseEntity.ok("A temporary password has been sent to the registered company email.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    /**
     * Send OTP to authenticated user's email for password change (Staff only)
     */
    @PostMapping("/otp/send")
    public ResponseEntity<?> sendOtp() {
        try {
            staffAuthService.sendOtpForPasswordChange();
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent successfully to your email", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    /**
     * Change password with OTP verification (Staff only)
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            staffAuthService.changePassword(request);
            return ResponseEntity.ok(new ApiResponse(true, "Password changed successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    /**
     * Initiate forgot password flow for staff users.
     * Sends OTP to the registered email address.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            staffAuthService.forgotPassword(request);
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent successfully to your email", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    /**
     * Reset password using OTP from forgot password flow.
     * Validates OTP and updates user's password.
     */
    @PostMapping("/reset-password-forgot-otp")
    public ResponseEntity<?> resetPasswordWithForgotOtp(@RequestBody ResetPasswordRequest request) {
        try {
            staffAuthService.resetPasswordWithForgotOtp(request);
            return ResponseEntity.ok(new ApiResponse(true, "Password reset successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    /**
     * Register a new staff user with multipart photo upload.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam("data") MultipartFile dataFile,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        try {
            // Read the data JSON from the uploaded file or form field
            String dataJson = new String(dataFile.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            // Register Java 8 date/time module
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            
            RegisterUserRequest request = mapper.readValue(dataJson, RegisterUserRequest.class);
            
            UserProfileResponse response = staffAuthService.registerUser(request, photo);
            return ResponseEntity.ok(ApiResponse.success("User registered successfully", response));
        } catch (com.security.Ace.Front.Line.Security.Solutions.exception.AuthenticationException e) {
            return ResponseEntity.status(409).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    /**
     * Get current authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        try {
            UserProfileResponse response = staffAuthService.getMyProfile();
            return ResponseEntity.ok(ApiResponse.success("Profile retrieved", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Update current user's personal information.
     */
    @PatchMapping("/me/personal-info")
    public ResponseEntity<?> updatePersonalInfo(@RequestBody UpdatePersonalInfoRequest request) {
        try {
            UserProfileResponse response = staffAuthService.updatePersonalInfo(request);
            return ResponseEntity.ok(ApiResponse.success("Personal info updated", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Update current user's profile photo (multipart).
     */
    @PatchMapping("/me/photo")
    public ResponseEntity<?> updatePhoto(@RequestParam("photo") MultipartFile photo) {
        try {
            UserProfileResponse response = staffAuthService.updatePhoto(photo);
            return ResponseEntity.ok(ApiResponse.success("Photo updated", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get all registered staff users.
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            var response = staffAuthService.getAllUsers();
            return ResponseEntity.ok(ApiResponse.success("Users retrieved", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get a specific user by ID.
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserProfileResponse response = staffAuthService.getUserById(id);
            return ResponseEntity.ok(ApiResponse.success("User retrieved", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get all users with a specific role.
     */
    @GetMapping("/users/role/{role}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        try {
            var response = staffAuthService.getUsersByRole(role);
            return ResponseEntity.ok(ApiResponse.success("Users retrieved", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get all users assigned to a specific area.
     */
    @GetMapping("/users/area/{area}")
    public ResponseEntity<?> getUsersByArea(@PathVariable String area) {
        try {
            var response = staffAuthService.getUsersByArea(area);
            return ResponseEntity.ok(ApiResponse.success("Users retrieved", response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Deactivate a user account.
     */
    @DeleteMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        try {
            staffAuthService.deactivateUser(id);
            return ResponseEntity.ok(ApiResponse.success("User deactivated", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        }
    }
}