package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.submission.SubmitAssignmentRequest;
import edu.hcmute.peergradehub.dto.response.submission.AssignmentSubmissionPageResponse;
import edu.hcmute.peergradehub.dto.response.submission.AssignmentSubmissionResponse;
import edu.hcmute.peergradehub.dto.response.submission.StudentSubmittableAssignmentResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface StudentSubmissionFacade {
    List<StudentSubmittableAssignmentResponse> getSubmittableAssignments(Long studentId);

    AssignmentSubmissionPageResponse getSubmissionPage(Long assignmentId, Long studentId);

    AssignmentSubmissionResponse submitAssignment(Long assignmentId, SubmitAssignmentRequest request, Long studentId);

    AssignmentSubmissionResponse uploadSubmissionFiles(Long assignmentId, List<MultipartFile> files, Long studentId);

    AssignmentSubmissionResponse getMySubmission(Long assignmentId, Long studentId);

    AssignmentSubmissionResponse getMySubmission(Long courseId, Long assignmentId, Long studentId);

    AssignmentSubmissionResponse getSubmissionDetail(Long courseId, Long assignmentId, Long submissionId, Long studentId);

    void deleteSubmission(Long courseId, Long assignmentId, Long submissionId, Long studentId);

    DownloadedSubmissionFile downloadSubmissionFile(Long submissionId, Long fileId, Long actorId);

    record DownloadedSubmissionFile(
            Resource resource,
            String fileName,
            String contentType
    ) {
    }
}
