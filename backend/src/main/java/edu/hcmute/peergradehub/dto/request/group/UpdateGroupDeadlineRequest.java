package edu.hcmute.peergradehub.dto.request.group;

import java.time.LocalDateTime;

public record UpdateGroupDeadlineRequest(
        LocalDateTime groupFormationDeadline
) {
}
