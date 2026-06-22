package edu.hcmute.peergradehub.dto.response.progress;

import edu.hcmute.peergradehub.enumeration.SubmissionStatus;

import java.time.LocalDateTime;

public record SubmissionProgressResponse(
        Long id,
        SubmissionStatus status,
        LocalDateTime submittedAt,
        Long submittedById,
        String note
) {
}
