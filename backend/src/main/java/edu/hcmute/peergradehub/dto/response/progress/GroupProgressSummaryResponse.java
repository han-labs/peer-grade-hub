package edu.hcmute.peergradehub.dto.response.progress;

import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;

import java.time.LocalDateTime;

public record GroupProgressSummaryResponse(
        Long groupId,
        String groupName,
        GroupStatus groupStatus,
        SubmissionStatus submissionStatus,
        LocalDateTime submittedAt,
        boolean late,
        long assignedReviewCount,
        long completedReviewCount,
        long incompleteReviewCount,
        long receivedReviewCount,
        boolean hasReceivedReview
) {
}
