package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.response.result.PublishedResultResponse;

public interface ResultViewService {
    PublishedResultResponse getPublishedResults(Long studentId, Long assignmentId);
}