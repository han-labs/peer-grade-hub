package edu.hcmute.peergradehub.dto.response.submission;

import java.time.LocalDateTime;

public record StudentSubmittableAssignmentResponse(
        Long assignmentId,
        String assignmentTitle,
        String description,
        Long courseId,
        String courseName,
        Long lessonId,
        String lessonTitle,
        Long groupId,
        String groupName,
        LocalDateTime submissionDeadline,
        Boolean deadlinePassed,
        Boolean warningRed,
        Long hoursRemaining,
        Long submissionId,
        String submissionStatus,
        LocalDateTime submittedAt,
        String studentSubmissionUrl
) {
}
