package edu.hcmute.peergradehub.dto.response.progress;

import edu.hcmute.peergradehub.enumeration.ReviewStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ReceivedReviewEvidenceResponse(
        Long peerReviewAssignmentId,
        Long reviewId,
        Long reviewerGroupId,
        String reviewerGroupName,
        ReviewStatus status,
        BigDecimal score,
        String comment,
        LocalDateTime submittedAt
) {
}
