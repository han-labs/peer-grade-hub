package edu.hcmute.peergradehub.dto.response.student;

public record JoinCourseResponse(
        Long courseId,
        String courseName,
        String classCode,
        Boolean alreadyJoined,
        String message
) {
}
