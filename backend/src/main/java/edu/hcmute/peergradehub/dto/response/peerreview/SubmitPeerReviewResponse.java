package edu.hcmute.peergradehub.dto.response.peerreview;

import java.time.LocalDateTime;

public record SubmitPeerReviewResponse(
        Long reviewId,
        LocalDateTime submittedAt
) {}
