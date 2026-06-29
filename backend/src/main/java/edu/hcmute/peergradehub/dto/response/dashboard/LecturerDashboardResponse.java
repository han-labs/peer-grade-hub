package edu.hcmute.peergradehub.dto.response.dashboard;

import java.util.List;

public record LecturerDashboardResponse(
        List<DashboardMetricResponse> metrics,
        List<DashboardCourseItemResponse> courses,
        List<DashboardAssignmentItemResponse> upcomingAssignments
) {
}
