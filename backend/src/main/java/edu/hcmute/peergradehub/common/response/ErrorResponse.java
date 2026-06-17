package edu.hcmute.peergradehub.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        boolean success,
        String code,
        String message,
        String path,
        List<FieldError> fieldErrors,
        LocalDateTime timestamp
) {

    public static ErrorResponse of(String code, String message, String path) {
        return new ErrorResponse(false, code, message, path, null, LocalDateTime.now());
    }

    public static ErrorResponse validation(String code, String message, String path, List<FieldError> fieldErrors) {
        return new ErrorResponse(false, code, message, path, fieldErrors, LocalDateTime.now());
    }

    public record FieldError(
            String field,
            String message
    ) {
    }
}
