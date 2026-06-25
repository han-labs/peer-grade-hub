package edu.hcmute.peergradehub.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;

@Component
public class LessonMapper {

    public LessonAssignmentsResponse toLessonAssignmentsResponse(
            Lesson lesson,
            Course course,
            List<Assignment> assignments
    ) {
        List<LessonAssignmentsResponse.AssignmentSummary> assignmentSummaries = assignments.stream()
                .map(this::toAssignmentSummary)
                .collect(Collectors.toList());

        return new LessonAssignmentsResponse(
                lesson.getId(),
                lesson.getTitle(),
                course.getId(),
                course.getCourseName(),
                assignmentSummaries
        );
    }

    public LessonAssignmentsResponse.AssignmentSummary toAssignmentSummary(Assignment assignment) {
        return new LessonAssignmentsResponse.AssignmentSummary(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getSubmissionDeadline(),
                assignment.getReviewDeadline(),
                assignment.getShowcaseMode()
        );
    }
}