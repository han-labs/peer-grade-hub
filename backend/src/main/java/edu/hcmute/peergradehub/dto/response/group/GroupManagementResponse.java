package edu.hcmute.peergradehub.dto.response.group;

import java.time.LocalDateTime;
import java.util.List;

public record GroupManagementResponse(
        Long courseId,
        String courseName,
        LocalDateTime groupFormationDeadline,
        List<StudentGroupResponse> groups
) {
}
