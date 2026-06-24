package edu.hcmute.peergradehub.dto.response.group;

import java.time.LocalDateTime;

public record GroupMemberResponse(
        Long groupMemberId,
        Long userId,
        String username,
        String fullName,
        String email,
        LocalDateTime joinedAt
) {
}
