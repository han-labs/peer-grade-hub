package edu.hcmute.peergradehub.dto.response.dashboard;

import java.time.LocalDateTime;

public record DashboardAssignmentItemResponse(
        Long id,
        String title,
        String courseName,
        String classCode,
        LocalDateTime submissionDeadline,
        LocalDateTime reviewDeadline
) {
}
