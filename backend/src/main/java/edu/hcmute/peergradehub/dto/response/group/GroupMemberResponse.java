package edu.hcmute.peergradehub.dto.response.group;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public record GroupMemberResponse(
        @JsonProperty("groupMemberId") Long groupMemberId,
        @JsonProperty("userId") Long userId,
        @JsonProperty("username") String username,
        @JsonProperty("fullName") String fullName,
        @JsonProperty("email") String email,
        @JsonProperty("joinedAt") LocalDateTime joinedAt
) {
}
