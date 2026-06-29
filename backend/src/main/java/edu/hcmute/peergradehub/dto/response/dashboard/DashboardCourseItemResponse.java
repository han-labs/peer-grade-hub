package edu.hcmute.peergradehub.dto.response.dashboard;

public record DashboardCourseItemResponse(
        Long id,
        String courseName,
        String classCode,
        String status,
        Long assignmentCount,
        Long groupCount
) {
}
