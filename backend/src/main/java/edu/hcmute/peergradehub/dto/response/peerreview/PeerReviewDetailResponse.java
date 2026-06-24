package edu.hcmute.peergradehub.dto.response.peerreview;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PeerReviewDetailResponse(
        Long reviewTaskId,
        AssignmentInfo assignment,
        GroupInfo revieweeGroup,
        SubmissionInfo submission,
        List<GuidelineInfo> guidelines,
        BigDecimal score,
        String comment,
        boolean submitted,
        LocalDateTime dueAt
) {
    public record AssignmentInfo(
            Long id,
            String title,
            String description
    ) {}

    public record GroupInfo(
            Long id,
            String groupName
    ) {}

    public record SubmissionInfo(
            Long id,
            String note,
            LocalDateTime submittedAt,
            List<AttachmentInfo> attachments
    ) {}

    public record AttachmentInfo(
            Long id,
            String type,
            String title,
            String fileName,
            String filePath,
            Double fileSizeMb,
            String fileType,
            String url,
            String label
    ) {}

    public record GuidelineInfo(
            Long id,
            String type,
            String title,
            String fileName,
            String filePath,
            Double fileSizeMb,
            String fileType,
            String url,
            String label
    ) {}
}
