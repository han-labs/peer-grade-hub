package edu.hcmute.peergradehub.dto.response.course;

import edu.hcmute.peergradehub.enumeration.CourseStatus;

public record CourseSummaryResponse(
        Long id,
        String courseName,
        String classCode,
        String invitationCode,
        String invitationLink,
        String semester,
        String description,
        CourseStatus courseStatus
) {
}
