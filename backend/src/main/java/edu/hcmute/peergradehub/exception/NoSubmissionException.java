package edu.hcmute.peergradehub.exception;

import lombok.Getter;

/**
 * Exception thrown when trying to publish grade for a group with no submission.
 * Corresponds to Exception Flow 3.1 of UC-09.
 */
@Getter
public class NoSubmissionException extends RuntimeException {

    private final Long groupId;
    private final String groupName;
    private final String errorCode;

    public NoSubmissionException(Long groupId, String groupName) {
        super(String.format("Cannot publish grade for [%s] because the group has not submitted the assignment.", groupName));
        this.groupId = groupId;
        this.groupName = groupName;
        this.errorCode = "NO_SUBMISSION";
    }

    public NoSubmissionException(String message) {
        super(message);
        this.groupId = null;
        this.groupName = null;
        this.errorCode = "NO_SUBMISSION";
    }
}