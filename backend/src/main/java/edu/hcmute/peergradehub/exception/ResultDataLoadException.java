package edu.hcmute.peergradehub.exception;

public class ResultDataLoadException extends ApiException {
    public ResultDataLoadException(String message) {
        super(ErrorCode.INTERNAL_SERVER_ERROR, message);
    }
}