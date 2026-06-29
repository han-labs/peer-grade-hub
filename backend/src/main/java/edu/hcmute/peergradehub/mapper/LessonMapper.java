package edu.hcmute.peergradehub.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.dto.response.lesson.AssignmentDetailResponse;
import edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;

@Component
public class LessonMapper {

    @Autowired
    private CourseMapper courseMapper;

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
        List<LessonMaterialResponse> materialResponses = assignment.getMaterials() != null
                ? assignment.getMaterials().stream()
                        .map(courseMapper::toMaterialResponse)
                        .collect(Collectors.toList())
                : java.util.Collections.emptyList();

        return new LessonAssignmentsResponse.AssignmentSummary(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getSubmissionDeadline(),
                assignment.getReviewDeadline(),
                assignment.getShowcaseMode(),
                assignment.getAppealDays(),
                materialResponses
        );
    }

    public AssignmentDetailResponse toAssignmentDetailResponse(Assignment assignment) {
        if (assignment == null) {
            return null;
        }

        List<LessonMaterialResponse> materialResponses = assignment.getMaterials() != null
                ? assignment.getMaterials().stream()
                        .map(courseMapper::toMaterialResponse)
                        .collect(Collectors.toList())
                : java.util.Collections.emptyList();

        return new AssignmentDetailResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getSubmissionDeadline(),
                assignment.getReviewDeadline(),
                assignment.getAppealDays(),
                assignment.getShowcaseMode(),
                assignment.getLesson().getId(),
                materialResponses
        );
    }
}