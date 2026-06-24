package edu.hcmute.peergradehub.dto.response.course;

import java.util.List;

public record CourseWorkspaceResponse(
        CourseSummaryResponse course,
        List<LessonResponse> lessons
) {
}
