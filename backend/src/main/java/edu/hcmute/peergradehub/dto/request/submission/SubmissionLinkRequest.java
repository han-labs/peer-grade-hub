package edu.hcmute.peergradehub.dto.request.submission;

public record SubmissionLinkRequest(
        String title,
        String url,
        String label
) {
}
