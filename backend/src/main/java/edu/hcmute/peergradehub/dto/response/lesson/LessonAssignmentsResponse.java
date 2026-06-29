package edu.hcmute.peergradehub.dto.response.lesson;

import java.time.LocalDateTime;
import java.util.List;

public record LessonAssignmentsResponse(
        Long lessonId,
        String lessonTitle,
        Long courseId,
        String courseName,
        List<AssignmentSummary> assignments
) {
    public record AssignmentSummary(
            Long id,
            String title,
            String description,
            LocalDateTime submissionDeadline,
            LocalDateTime reviewDeadline,
            Boolean showcaseMode,
            Integer appealDays,
            List<edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse> materials
    ) {}
}