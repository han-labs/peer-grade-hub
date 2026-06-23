package edu.hcmute.peergradehub.dto.request.course;

public record CreateCourseRequest(
        String courseName,
        String classCode,
        String semester,
        String description
) {
}
