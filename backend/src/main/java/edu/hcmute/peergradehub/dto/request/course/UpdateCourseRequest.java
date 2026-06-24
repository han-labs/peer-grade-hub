package edu.hcmute.peergradehub.dto.request.course;

public record UpdateCourseRequest(
        String courseName,
        String classCode,
        String semester,
        String description
) {
}
