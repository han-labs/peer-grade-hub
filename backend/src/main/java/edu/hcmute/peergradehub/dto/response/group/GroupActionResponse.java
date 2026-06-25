package edu.hcmute.peergradehub.dto.response.group;

public record GroupActionResponse(
        String message,
        GroupManagementResponse groupManagement
) {
}
