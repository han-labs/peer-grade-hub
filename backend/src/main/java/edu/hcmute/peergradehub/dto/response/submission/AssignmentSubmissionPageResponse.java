package edu.hcmute.peergradehub.dto.response.submission;

import java.time.LocalDateTime;
import java.util.List;

public record AssignmentSubmissionPageResponse(
        Long assignmentId,
        String assignmentTitle,
        String description,
        Long courseId,
        String courseName,
        Long groupId,
        String groupName,
        LocalDateTime submissionDeadline,
        Boolean deadlinePassed,
        Boolean warningRed,
        Long hoursRemaining,
        List<SubmissionAttachmentResponse> requirementFiles,
        List<SubmissionAttachmentResponse> guidelineFiles,
        AssignmentSubmissionResponse currentSubmission
) {
}
