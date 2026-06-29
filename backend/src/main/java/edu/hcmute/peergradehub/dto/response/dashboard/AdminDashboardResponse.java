package edu.hcmute.peergradehub.dto.response.dashboard;

import java.util.List;

public record AdminDashboardResponse(
        List<DashboardMetricResponse> metrics,
        List<DashboardCourseItemResponse> recentCourses
) {
}
