package edu.hcmute.peergradehub.dto.response.progress;

import edu.hcmute.peergradehub.enumeration.ProgressFilter;

import java.util.List;

public record FilteredProgressGroupsResponse(
        ProgressFilter filter,
        List<GroupProgressSummaryResponse> groups
) {
}
