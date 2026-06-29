package edu.hcmute.peergradehub.exception;

public class GalleryDataLoadException extends ApiException {
    public GalleryDataLoadException(String message) {
        super(ErrorCode.INTERNAL_SERVER_ERROR, message);
    }
}