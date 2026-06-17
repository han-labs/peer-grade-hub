package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Lesson;

import java.time.LocalDateTime;

public interface AssignmentService {
    Assignment createAssignment(String title, String description, LocalDateTime deadline,
                                LocalDateTime reviewDeadline, Lesson lesson);

    Assignment updateAssignment(Assignment assignment, String title, String description,
                                LocalDateTime deadline, LocalDateTime reviewDeadline);

    Assignment setShowcaseMode(Assignment assignment, boolean showcaseMode);
}
