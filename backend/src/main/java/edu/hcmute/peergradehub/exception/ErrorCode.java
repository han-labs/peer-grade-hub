package edu.hcmute.peergradehub.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    BAD_REQUEST("BAD_REQUEST", "The request is invalid.", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("UNAUTHORIZED", "Authentication is required.", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("FORBIDDEN", "You do not have permission to perform this action.", HttpStatus.FORBIDDEN),
    NOT_FOUND("NOT_FOUND", "The requested resource was not found.", HttpStatus.NOT_FOUND),
    CONFLICT("CONFLICT", "The request conflicts with the current resource state.", HttpStatus.CONFLICT),
    VALIDATION_ERROR("VALIDATION_ERROR", "Validation failed.", HttpStatus.BAD_REQUEST),
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus status;

    ErrorCode(String code, String defaultMessage, HttpStatus status) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
