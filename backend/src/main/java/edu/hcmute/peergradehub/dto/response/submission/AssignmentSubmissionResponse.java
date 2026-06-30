package edu.hcmute.peergradehub.dto.response.submission;

import java.time.LocalDateTime;
import java.util.List;

public record AssignmentSubmissionResponse(
        Long submissionId,
        Long assignmentId,
        Long groupId,
        String groupName,
        String status,
        String note,
        Long submittedById,
        String submittedByName,
        LocalDateTime submittedAt,
        List<SubmissionAttachmentResponse> attachments,
        String message,
        String studentSubmissionUrl,
        String lecturerSubmissionUrl
) {
}
