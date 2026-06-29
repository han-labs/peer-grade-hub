package edu.hcmute.peergradehub.dto.response.student;

public record JoinGroupResponse(
        Long courseId,
        Long groupId,
        String groupName,
        Long currentGroupId,
        String message
) {
}
