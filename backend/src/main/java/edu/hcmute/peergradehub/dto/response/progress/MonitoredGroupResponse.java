package edu.hcmute.peergradehub.dto.response.progress;

import edu.hcmute.peergradehub.enumeration.GroupStatus;

public record MonitoredGroupResponse(
        Long id,
        String name,
        GroupStatus status
) {
}
