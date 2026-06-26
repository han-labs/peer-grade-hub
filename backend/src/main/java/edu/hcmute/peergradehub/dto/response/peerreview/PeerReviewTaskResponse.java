package edu.hcmute.peergradehub.dto.response.peerreview;

import java.time.LocalDateTime;

public record PeerReviewTaskResponse(
        Long id,
        String assignmentTitle,
        String revieweeGroupName,
        LocalDateTime dueAt,
        boolean submitted
) {}
