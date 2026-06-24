package edu.hcmute.peergradehub.exception;

import lombok.Getter;

/**
 * Exception thrown when grade validation fails.
 * Corresponds to Exception Flows 2.1 and 2.2 of UC-09.
 */
@Getter
public class GradeValidationException extends RuntimeException {

    private final String errorCode;

    public GradeValidationException(String message) {
        super(message);
        this.errorCode = "GRADE_VALIDATION_ERROR";
    }

    public GradeValidationException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public GradeValidationException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "GRADE_VALIDATION_ERROR";
    }

    // Factory methods for common validation errors
    public static GradeValidationException invalidScore() {
        return new GradeValidationException(
            "Invalid grade format. Please enter a valid grade within the allowed grading scale (0-100).",
            "INVALID_SCORE"
        );
    }

    public static GradeValidationException commentTooLong() {
        return new GradeValidationException(
            "Final comment exceeds the maximum allowed length (2000 characters). Please shorten your comment.",
            "COMMENT_TOO_LONG"
        );
    }

    public static GradeValidationException noGroupSelected() {
        return new GradeValidationException(
            "Please select at least one group to publish grades for.",
            "NO_GROUP_SELECTED"
        );
    }
}