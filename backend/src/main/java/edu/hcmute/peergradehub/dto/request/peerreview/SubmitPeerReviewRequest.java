package edu.hcmute.peergradehub.dto.request.peerreview;

import java.math.BigDecimal;

public record SubmitPeerReviewRequest(
        BigDecimal score,
        String comment
) {}
