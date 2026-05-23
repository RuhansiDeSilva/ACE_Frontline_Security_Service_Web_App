// package com.security.Ace.Front.Line.Security.Solutions.exception;

// import com.security.Ace.Front.Line.Security.Solutions.dto.ErrorResponse;
// import jakarta.servlet.http.HttpServletRequest;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.validation.FieldError;
// import org.springframework.web.bind.MethodArgumentNotValidException;
// import org.springframework.web.bind.annotation.ExceptionHandler;
// import org.springframework.web.bind.annotation.RestControllerAdvice;

// import java.time.LocalDateTime;
// import java.util.ArrayList;
// import java.util.List;

// @RestControllerAdvice
// public class GlobalExceptionHandler {

//     // Handle Resource Not Found
//     @ExceptionHandler(ResourceNotFoundException.class)
//     public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
//             ResourceNotFoundException ex, HttpServletRequest request) {

//         ErrorResponse error = new ErrorResponse(
//                 LocalDateTime.now(),
//                 HttpStatus.NOT_FOUND.value(),
//                 "Not Found",
//                 ex.getMessage(),
//                 request.getRequestURI()
//         );

//         return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
//     }

//     // Handle Duplicate Resource
//     @ExceptionHandler(DuplicateResourceException.class)
//     public ResponseEntity<ErrorResponse> handleDuplicateResourceException(
//             DuplicateResourceException ex, HttpServletRequest request) {

//         ErrorResponse error = new ErrorResponse(
//                 LocalDateTime.now(),
//                 HttpStatus.CONFLICT.value(),
//                 "Conflict",
//                 ex.getMessage(),
//                 request.getRequestURI()
//         );

//         return new ResponseEntity<>(error, HttpStatus.CONFLICT);
//     }

//     // Handle Invalid Operation
//     @ExceptionHandler(InvalidOperationException.class)
//     public ResponseEntity<ErrorResponse> handleInvalidOperationException(
//             InvalidOperationException ex, HttpServletRequest request) {

//         ErrorResponse error = new ErrorResponse(
//                 LocalDateTime.now(),
//                 HttpStatus.BAD_REQUEST.value(),
//                 "Bad Request",
//                 ex.getMessage(),
//                 request.getRequestURI()
//         );

//         return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
//     }

//     // Handle Authentication Exception
//     @ExceptionHandler(AuthenticationException.class)
//     public ResponseEntity<ErrorResponse> handleAuthenticationException(
//             AuthenticationException ex, HttpServletRequest request) {

//         ErrorResponse error = new ErrorResponse(
//                 LocalDateTime.now(),
//                 HttpStatus.UNAUTHORIZED.value(),
//                 "Unauthorized",
//                 ex.getMessage(),
//                 request.getRequestURI()
//         );

//         return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
//     }

//     // Handle File Storage Exception
//     @ExceptionHandler(FileStorageException.class)
//     public ResponseEntity<ErrorResponse> handleFileStorageException(
//             FileStorageException ex, HttpServletRequest request) {

//         ErrorResponse error = new ErrorResponse(
//                 LocalDateTime.now(),
//                 HttpStatus.INTERNAL_SERVER_ERROR.value(),
//                 "File Storage Error",
//                 ex.getMessage(),
//                 request.getRequestURI()
//         );

//         return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
//     }

//     // Handle Validation Errors
//     @ExceptionHandler(MethodArgumentNotValidException.class)
//     public ResponseEntity<ErrorResponse> handleValidationException(
//             MethodArgumentNotValidException ex, HttpServletRequest request) {

//         List<String> validationErrors = new ArrayList<>();

//         for (FieldError error : ex.getBindingResult().getFieldErrors()) {
//             validationErrors.add(error.getField() + ": " + error.getDefaultMessage());
//         }

//         ErrorResponse error = new ErrorResponse(
//                 LocalDateTime.now(),
//                 HttpStatus.BAD_REQUEST.value(),
//                 "Validation Failed",
//                 "Invalid input data",
//                 request.getRequestURI(),
//                 validationErrors
//         );

//         return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
//     }

//     // Handle All Other Exceptions
//     @ExceptionHandler(Exception.class)
//     public ResponseEntity<ErrorResponse> handleGlobalException(
//             Exception ex, HttpServletRequest request) {

//         ErrorResponse error = new ErrorResponse(
//                 LocalDateTime.now(),
//                 HttpStatus.INTERNAL_SERVER_ERROR.value(),
//                 "Internal Server Error",
//                 ex.getMessage(),
//                 request.getRequestURI()
//         );

//         return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
//     }
// }

package com.security.Ace.Front.Line.Security.Solutions.exception;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.security.Ace.Front.Line.Security.Solutions.dto.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // From new handler (GOOD)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(), HttpStatus.NOT_FOUND.value(), "Not Found",
                ex.getMessage(), request.getRequestURI());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    // From new handler (GOOD)
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(
            DuplicateResourceException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(), HttpStatus.CONFLICT.value(), "Conflict",
                ex.getMessage(), request.getRequestURI());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    // From new handler (GOOD)
    @ExceptionHandler(InvalidOperationException.class)
    public ResponseEntity<ErrorResponse> handleInvalidOperationException(
            InvalidOperationException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "Bad Request",
                ex.getMessage(), request.getRequestURI());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // From new handler (GOOD)
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(), HttpStatus.UNAUTHORIZED.value(), "Unauthorized",
                ex.getMessage(), request.getRequestURI());
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    // From new handler (GOOD)
    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ErrorResponse> handleFileStorageException(
            FileStorageException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(), HttpStatus.INTERNAL_SERVER_ERROR.value(), "File Storage Error",
                ex.getMessage(), request.getRequestURI());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // MERGED from old handler
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "Bad Request",
                "File size exceeds maximum allowed limit.", request.getRequestURI());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // From new handler (BETTER version)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> validationErrors = new ArrayList<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            validationErrors.add(error.getField() + ": " + error.getDefaultMessage());
        }
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "Validation Failed",
                "Invalid input data", request.getRequestURI(), validationErrors);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // From new handler (GOOD)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, HttpServletRequest request) {
        // Log the exception for debugging
        System.err.println("Unhandled exception occurred: " + ex.getMessage());
        ex.printStackTrace();
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(), HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error",
                "An unexpected error occurred: " + (ex.getMessage() != null ? ex.getMessage() : "Unknown error"), request.getRequestURI());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}