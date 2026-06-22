package edu.hcmute.peergradehub.dto.response.peerreview;

import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;

import java.time.LocalDateTime;

public record PeerReviewAssignmentResponse(
        Long id,
        Long assignmentId,
        PeerReviewGroupOptionResponse reviewerGroup,
        PeerReviewGroupOptionResponse targetGroup,
        ReviewAssignmentStatus status,
        Long assignedById,
        LocalDateTime assignedAt,
        LocalDateTime dueAt
) {
}
