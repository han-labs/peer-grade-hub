package edu.hcmute.peergradehub.dto.response.group;

import java.util.List;

public record StudentGroupResponse(
        Long groupId,
        String groupName,
        Integer maxMembers,
        String groupStatus,
        Integer memberCount,
        List<GroupMemberResponse> members
) {
}
