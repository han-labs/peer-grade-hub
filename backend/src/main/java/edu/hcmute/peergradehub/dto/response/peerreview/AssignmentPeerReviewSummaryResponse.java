package edu.hcmute.peergradehub.dto.response.peerreview;

import java.time.LocalDateTime;

public record AssignmentPeerReviewSummaryResponse(
        Long id,
        String title,
        Long courseId,
        String courseName,
        String classCode,
        LocalDateTime reviewDeadline,
        boolean reviewDeadlineOpen
) {
}
