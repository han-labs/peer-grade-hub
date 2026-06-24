package edu.hcmute.peergradehub.dto.response.grade;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for peer review evidence visible to Lecturer.
 * Reviewer identity is visible to Lecturer (BR-12).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerReviewEvidenceResponse {

    private Long reviewerGroupId;
    private String reviewerGroupName;
    private String reviewerGroupMemberNames; // Comma-separated list for lecturer visibility

    private BigDecimal score;
    private String comment;
    private String submittedAt;
    private String reviewStatus; // DRAFT, SUBMITTED, COMPLETED

    // Anonymous version for students (if Showcase Mode is enabled)
    private String anonymousReviewerName; // e.g., "Group A" or "Reviewer 1"
}