package edu.hcmute.peergradehub.dto.response.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Personal results for a student's own group.
 * Includes final grade, lecturer comment, and peer feedback.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalResultResponse {

    private Long groupId;
    private String groupName;
    private BigDecimal finalScore;
    private String lecturerComment;
    private String publishedAt;
    private String publishedBy;
    private List<PeerFeedbackResponse> peerFeedbacks;
}