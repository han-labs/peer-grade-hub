package edu.hcmute.peergradehub.dto.response.student;

import java.time.LocalDateTime;
import java.util.List;

public record GroupSelectionResponse(
        Long courseId,
        String courseName,
        LocalDateTime groupFormationDeadline,
        Boolean deadlinePassed,
        Long currentGroupId,
        List<GroupOptionResponse> groups
) {
    public record GroupOptionResponse(
            Long groupId,
            String groupName,
            Integer maxMembers,
            Integer currentMembers,
            Boolean full,
            Boolean locked,
            List<GroupMemberPreviewResponse> members
    ) {
    }

    public record GroupMemberPreviewResponse(
            String fullName
    ) {
    }
}
