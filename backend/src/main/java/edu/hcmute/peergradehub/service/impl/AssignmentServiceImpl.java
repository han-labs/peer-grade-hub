package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentDao assignmentRepository;

    @Override
    @Transactional
    public Assignment createAssignment(String title, String description, LocalDateTime submissionDeadline,
                                       LocalDateTime reviewDeadline, Lesson lesson) {
        if (reviewDeadline == null || submissionDeadline == null || !reviewDeadline.isAfter(submissionDeadline)) {
            throw new IllegalArgumentException("Review deadline must be after the submission deadline.");
        }
        Assignment assignment = Assignment.builder()
                .title(title)
                .description(description)
                .submissionDeadline(submissionDeadline)
                .reviewDeadline(reviewDeadline)
                .lesson(lesson)
                .build();
        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public Assignment updateAssignment(Assignment assignment, String title, String description,
                                       LocalDateTime submissionDeadline, LocalDateTime reviewDeadline) {
        if (reviewDeadline == null || submissionDeadline == null || !reviewDeadline.isAfter(submissionDeadline)) {
            throw new IllegalArgumentException("Review deadline must be after the submission deadline.");
        }
        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setSubmissionDeadline(submissionDeadline);
        assignment.setReviewDeadline(reviewDeadline);
        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public Assignment setShowcaseMode(Assignment assignment, boolean showcaseMode) {
        assignment.setShowcaseMode(showcaseMode);
        return assignmentRepository.save(assignment);
    }
}
