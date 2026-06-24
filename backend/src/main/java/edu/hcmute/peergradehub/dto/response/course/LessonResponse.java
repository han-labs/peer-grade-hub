package edu.hcmute.peergradehub.dto.response.course;

import java.util.List;

public record LessonResponse(
        Long id,
        String title,
        List<LessonMaterialResponse> materials
) {
}
