package edu.hcmute.peergradehub.dto.response.progress;

import java.util.List;

public record GroupMonitoringDetailResponse(
        MonitoredGroupResponse group,
        SubmissionProgressResponse submission,
        List<OutgoingReviewProgressResponse> outgoingReviews,
        List<ReceivedReviewEvidenceResponse> receivedReviewEvidence
) {
}
