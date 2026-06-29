package edu.hcmute.peergradehub.dto.response.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Peer feedback from one reviewer group.
 * Reviewer identity is anonymous to students (BR-12).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerFeedbackResponse {

    private String anonymousReviewerName; // e.g., "Group B" or "Reviewer 1"
    private BigDecimal score;
    private String comment;
    private String submittedAt;
}