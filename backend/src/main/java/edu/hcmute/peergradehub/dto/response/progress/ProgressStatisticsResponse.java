package edu.hcmute.peergradehub.dto.response.progress;

import java.math.BigDecimal;

public record ProgressStatisticsResponse(
        long totalGroups,
        long submittedCount,
        long pendingCount,
        long lateCount,
        BigDecimal submissionCompletionRate,
        long totalReviewAssignments,
        long completedReviews,
        long incompleteReviews,
        BigDecimal peerReviewCompletionRate,
        long groupsWithNoReceivedReview,
        long groupsWithIncompleteAssignedReviews
) {
}
