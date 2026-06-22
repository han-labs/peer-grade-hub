package edu.hcmute.peergradehub.dto.response.progress;

import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;

import java.time.LocalDateTime;

public record OutgoingReviewProgressResponse(
        Long peerReviewAssignmentId,
        Long targetGroupId,
        String targetGroupName,
        ReviewAssignmentStatus assignmentStatus,
        ReviewStatus reviewStatus,
        LocalDateTime assignedAt,
        LocalDateTime dueAt,
        LocalDateTime submittedAt
) {
}
