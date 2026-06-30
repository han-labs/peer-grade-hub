package edu.hcmute.peergradehub.dto.response.submission;

public record SubmissionAttachmentResponse(
        Long attachmentId,
        String attachmentType,
        String title,
        String fileName,
        String filePath,
        Double fileSizeMb,
        String fileType,
        String url,
        String label,
        String downloadUrl,
        String openUrl
) {
}
