package edu.hcmute.peergradehub.mapper;

import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewDetailResponse;
import edu.hcmute.peergradehub.entity.*;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PeerReviewMapper {

    public PeerReviewDetailResponse toDetailResponse(
            PeerReviewAssignment task,
            AssignmentSubmission submission,
            List<SubmissionAttachment> submissionAttachments,
            List<LessonMaterial> guidelines,
            PeerReview existingReview
    ) {
        PeerReviewDetailResponse.AssignmentInfo assignmentInfo = new PeerReviewDetailResponse.AssignmentInfo(
                task.getAssignment().getId(),
                task.getAssignment().getTitle(),
                task.getAssignment().getDescription()
        );

        PeerReviewDetailResponse.GroupInfo revieweeGroupInfo = new PeerReviewDetailResponse.GroupInfo(
                task.getRevieweeGroup().getId(),
                task.getRevieweeGroup().getGroupName()
        );

        PeerReviewDetailResponse.SubmissionInfo submissionInfo = null;
        if (submission != null) {
            List<PeerReviewDetailResponse.AttachmentInfo> attachmentInfos = submissionAttachments.stream()
                    .map(att -> new PeerReviewDetailResponse.AttachmentInfo(
                            att.getId(),
                            att.getAttachmentType() != null ? att.getAttachmentType().name() : null,
                            att.getTitle(),
                            att.getFileName(),
                            att.getFilePath(),
                            att.getFileSizeMb(),
                            att.getFileType(),
                            att.getUrl(),
                            att.getLabel()
                    ))
                    .toList();

            submissionInfo = new PeerReviewDetailResponse.SubmissionInfo(
                    submission.getId(),
                    submission.getNote(),
                    submission.getSubmittedAt(),
                    attachmentInfos
            );
        }

        List<PeerReviewDetailResponse.GuidelineInfo> guidelineInfos = guidelines.stream()
                .map(mat -> {
                    String type = "LINK";
                    String fileName = null;
                    String filePath = null;
                    Double fileSizeMb = null;
                    String fileType = null;
                    String url = null;
                    String label = null;

                    if (mat instanceof FileAttachment file) {
                        type = "FILE";
                        fileName = file.getFileName();
                        filePath = file.getFilePath();
                        fileSizeMb = file.getFileSizeMb();
                        fileType = file.getFileType();
                    } else if (mat instanceof LinkAttachment link) {
                        type = "LINK";
                        url = link.getUrl();
                        label = link.getLabel();
                    }

                    return new PeerReviewDetailResponse.GuidelineInfo(
                            mat.getId(),
                            type,
                            mat.getTitle(),
                            fileName,
                            filePath,
                            fileSizeMb,
                            fileType,
                            url,
                            label
                    );
                })
                .toList();

        return new PeerReviewDetailResponse(
                task.getId(),
                assignmentInfo,
                revieweeGroupInfo,
                submissionInfo,
                guidelineInfos,
                existingReview != null ? existingReview.getScore() : null,
                existingReview != null ? existingReview.getComment() : null,
                existingReview != null && existingReview.getReviewStatus() == ReviewStatus.SUBMITTED,
                task.getDueAt()
        );
    }
}
