package edu.hcmute.peergradehub.dto.response.progress;

import java.util.List;

public record ProgressDashboardResponse(
        CourseProgressSummaryResponse course,
        AssignmentProgressSummaryResponse assignment,
        ProgressStatisticsResponse statistics,
        List<GroupProgressSummaryResponse> groups
) {
}
