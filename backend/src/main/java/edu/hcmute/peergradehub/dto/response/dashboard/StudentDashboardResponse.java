package edu.hcmute.peergradehub.dto.response.dashboard;

import java.util.List;

public record StudentDashboardResponse(
        List<DashboardMetricResponse> metrics,
        List<DashboardCourseItemResponse> joinedCourses,
        List<DashboardAssignmentItemResponse> upcomingAssignments
) {
}
