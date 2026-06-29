package edu.hcmute.peergradehub.dto.response.dashboard;

public record DashboardMetricResponse(
        String key,
        String label,
        Long value,
        String hint
) {
}
