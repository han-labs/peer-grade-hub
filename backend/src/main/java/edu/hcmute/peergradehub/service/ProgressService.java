package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.response.progress.FilteredProgressGroupsResponse;
import edu.hcmute.peergradehub.dto.response.progress.GroupMonitoringDetailResponse;
import edu.hcmute.peergradehub.dto.response.progress.ProgressDashboardResponse;
import edu.hcmute.peergradehub.enumeration.ProgressFilter;

public interface ProgressService {

    ProgressDashboardResponse getMonitoringDashboard(
            Long courseId,
            Long assignmentId,
            Long lecturerId
    );

    FilteredProgressGroupsResponse getFilteredMonitoringGroups(
            Long courseId,
            Long assignmentId,
            ProgressFilter filter,
            Long lecturerId
    );

    GroupMonitoringDetailResponse getGroupMonitoringDetails(
            Long assignmentId,
            Long groupId,
            Long lecturerId
    );
}
