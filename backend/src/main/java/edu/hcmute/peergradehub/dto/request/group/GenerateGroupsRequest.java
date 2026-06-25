package edu.hcmute.peergradehub.dto.request.group;

import java.time.LocalDateTime;

public record GenerateGroupsRequest(
        Integer numberOfGroups,
        Integer maxGroupSize,
        LocalDateTime groupFormationDeadline
) {
}
