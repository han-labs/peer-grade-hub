package edu.hcmute.peergradehub.dto.request.submission;

import java.util.List;

public record SubmitAssignmentRequest(
        String note,
        List<SubmissionLinkRequest> links,
        List<SubmissionFileRequest> files
) {
}
