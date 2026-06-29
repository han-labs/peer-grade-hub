package edu.hcmute.peergradehub.dto.response.lesson;

import edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse;
import java.time.LocalDateTime;
import java.util.List;

public record AssignmentDetailResponse(
        Long id,
        String title,
        String description,
        LocalDateTime submissionDeadline,
        LocalDateTime reviewDeadline,
        Integer appealDays,
        Boolean showcaseMode,
        Long lessonId,
        List<LessonMaterialResponse> materials
) {
}
