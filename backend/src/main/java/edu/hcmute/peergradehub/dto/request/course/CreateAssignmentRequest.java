package edu.hcmute.peergradehub.dto.request.course;

import java.time.LocalDateTime;
import java.util.List;

public record CreateAssignmentRequest(
        String title,
        String description,
        LocalDateTime submissionDeadline,
        LocalDateTime reviewDeadline,
        Integer appealDays,
        List<CreateLessonMaterialRequest> materials
) {
}
