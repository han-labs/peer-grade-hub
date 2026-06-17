package edu.hcmute.peergradehub.exception;

public class ConflictException extends ApiException {

    public ConflictException() {
        super(ErrorCode.CONFLICT);
    }

    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message);
    }
}
