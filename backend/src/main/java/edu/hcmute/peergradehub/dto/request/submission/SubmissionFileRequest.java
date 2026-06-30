package edu.hcmute.peergradehub.dto.request.submission;

public record SubmissionFileRequest(
        String title,
        String fileName,
        String filePath,
        Double fileSizeMb,
        String fileType,
        String label
) {
}
