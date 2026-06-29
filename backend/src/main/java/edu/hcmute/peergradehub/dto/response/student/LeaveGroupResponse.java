package edu.hcmute.peergradehub.dto.response.student;

public record LeaveGroupResponse(
        Long courseId,
        Long oldGroupId,
        String oldGroupName,
        Long currentGroupId,
        String message
) {
}
