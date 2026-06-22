package edu.hcmute.peergradehub.dto.response.progress;

import edu.hcmute.peergradehub.enumeration.CourseStatus;

import java.time.LocalDateTime;

public record CourseProgressSummaryResponse(
        Long id,
        String name,
        String classCode,
        LocalDateTime groupFormationDeadline,
        CourseStatus status
) {
}
