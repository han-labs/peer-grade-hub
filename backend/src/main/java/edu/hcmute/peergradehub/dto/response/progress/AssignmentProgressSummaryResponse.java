package edu.hcmute.peergradehub.dto.response.progress;

import java.time.LocalDateTime;

public record AssignmentProgressSummaryResponse(
        Long id,
        String title,
        LocalDateTime submissionDeadline,
        LocalDateTime reviewDeadline
) {
}
