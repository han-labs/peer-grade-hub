package edu.hcmute.peergradehub.assignment.service;

import edu.hcmute.peergradehub.assignment.model.Assignment;
import edu.hcmute.peergradehub.assignment.repository.AssignmentRepository;
import edu.hcmute.peergradehub.lesson.model.Lesson;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;

    @Transactional
    public Assignment createAssignment(String title, String description, LocalDateTime deadline,
                                       LocalDateTime reviewDeadline, Lesson lesson) {
        if (reviewDeadline == null || deadline == null || !reviewDeadline.isAfter(deadline)) {
            throw new IllegalArgumentException("Review deadline must be after the submission deadline.");
        }
        Assignment assignment = Assignment.builder()
                .title(title)
                .description(description)
                .deadline(deadline)
                .reviewDeadline(reviewDeadline)
                .lesson(lesson)
                .build();
        return assignmentRepository.save(assignment);
    }

    @Transactional
    public Assignment updateAssignment(Assignment assignment, String title, String description,
                                       LocalDateTime deadline, LocalDateTime reviewDeadline) {
        if (reviewDeadline == null || deadline == null || !reviewDeadline.isAfter(deadline)) {
            throw new IllegalArgumentException("Review deadline must be after the submission deadline.");
        }
        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setDeadline(deadline);
        assignment.setReviewDeadline(reviewDeadline);
        return assignmentRepository.save(assignment);
    }

    @Transactional
    public Assignment setShowcaseMode(Assignment assignment, boolean showcaseMode) {
        assignment.setShowcaseMode(showcaseMode);
        return assignmentRepository.save(assignment);
    }
}
