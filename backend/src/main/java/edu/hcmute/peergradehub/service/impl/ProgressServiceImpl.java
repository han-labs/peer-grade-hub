package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.AssignmentSubmissionDao;
import edu.hcmute.peergradehub.dao.PeerReviewAssignmentDao;
import edu.hcmute.peergradehub.dao.PeerReviewDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.response.progress.FilteredProgressGroupsResponse;
import edu.hcmute.peergradehub.dto.response.progress.GroupMonitoringDetailResponse;
import edu.hcmute.peergradehub.dto.response.progress.ProgressDashboardResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.ProgressFilter;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.exception.ApiException;
import edu.hcmute.peergradehub.exception.ErrorCode;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.mapper.ProgressMapper;
import edu.hcmute.peergradehub.service.ProgressService;
import edu.hcmute.peergradehub.service.support.ProgressStatisticsCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressServiceImpl implements ProgressService {

    public static final String DASHBOARD_LOAD_ERROR_MESSAGE =
            "Assessment data could not be loaded. Please refresh the page or try again later.";
    public static final String GROUP_NOT_ACCESSIBLE_MESSAGE =
            "Selected group no longer exists or you do not have permission to view it.";
    public static final String REVIEW_EVIDENCE_ERROR_MESSAGE =
            "Review evidence could not be displayed. Please check the assessment configuration "
                    + "or contact the administrator.";

    private final AssignmentDao assignmentDao;
    private final StudentGroupDao studentGroupDao;
    private final AssignmentSubmissionDao assignmentSubmissionDao;
    private final PeerReviewAssignmentDao peerReviewAssignmentDao;
    private final PeerReviewDao peerReviewDao;
    private final UserDao userDao;
    private final ProgressStatisticsCalculator calculator;
    private final ProgressMapper mapper;

    @Override
    public ProgressDashboardResponse getMonitoringDashboard(
            Long courseId,
            Long assignmentId,
            Long lecturerId
    ) {
        MonitoringSnapshot snapshot = loadMonitoringSnapshot(courseId, assignmentId, lecturerId);
        return mapper.toDashboardResponse(
                snapshot.course(),
                snapshot.assignment(),
                snapshot.calculation().statistics(),
                snapshot.calculation().groups()
        );
    }

    @Override
    public FilteredProgressGroupsResponse getFilteredMonitoringGroups(
            Long courseId,
            Long assignmentId,
            ProgressFilter filter,
            Long lecturerId
    ) {
        MonitoringSnapshot snapshot = loadMonitoringSnapshot(courseId, assignmentId, lecturerId);
        ProgressFilter effectiveFilter = filter == null ? ProgressFilter.ALL : filter;
        return new FilteredProgressGroupsResponse(
                effectiveFilter,
                calculator.filter(snapshot.calculation().groups(), effectiveFilter)
        );
    }

    @Override
    public GroupMonitoringDetailResponse getGroupMonitoringDetails(
            Long assignmentId,
            Long groupId,
            Long lecturerId
    ) {
        requireLecturer(lecturerId);
        Assignment assignment = requireOwnedAssignment(null, assignmentId, lecturerId);
        Course course = assignment.getLesson().getCourse();
        StudentGroup group = studentGroupDao.findByIdAndCourseId(groupId, course.getId())
                .orElseThrow(() -> new NotFoundException(GROUP_NOT_ACCESSIBLE_MESSAGE));
        AssignmentSubmission submission = assignmentSubmissionDao
                .findByAssignmentIdAndGroupId(assignmentId, groupId)
                .orElse(null);

        try {
            List<PeerReviewAssignment> reviewAssignments =
                    peerReviewAssignmentDao.findByAssignmentId(assignmentId);
            List<PeerReview> reviews = peerReviewDao.findByAssignmentId(assignmentId);
            Map<Long, PeerReview> reviewsByAssignmentId = reviews.stream()
                    .collect(Collectors.toMap(
                            review -> review.getPeerReviewAssignment().getId(),
                            Function.identity()
                    ));
            List<PeerReviewAssignment> outgoing = reviewAssignments.stream()
                    .filter(reviewAssignment -> groupId.equals(
                            reviewAssignment.getReviewerGroup().getId()
                    ))
                    .sorted(Comparator.comparing(PeerReviewAssignment::getId))
                    .toList();
            List<PeerReview> receivedEvidence = reviews.stream()
                    .filter(review -> groupId.equals(
                            review.getPeerReviewAssignment().getRevieweeGroup().getId()
                    ))
                    .sorted(Comparator.comparing(PeerReview::getId))
                    .toList();

            return mapper.toGroupDetailResponse(
                    group,
                    submission,
                    outgoing,
                    receivedEvidence,
                    reviewsByAssignmentId
            );
        } catch (DataAccessException exception) {
            throw reviewEvidenceException();
        }
    }

    private MonitoringSnapshot loadMonitoringSnapshot(
            Long courseId,
            Long assignmentId,
            Long lecturerId
    ) {
        try {
            requireLecturer(lecturerId);
            Assignment assignment = requireOwnedAssignment(courseId, assignmentId, lecturerId);
            Course course = assignment.getLesson().getCourse();
            List<StudentGroup> groups = studentGroupDao.findByCourseId(course.getId());
            List<AssignmentSubmission> submissions =
                    assignmentSubmissionDao.findByAssignmentId(assignmentId);
            List<PeerReviewAssignment> reviewAssignments =
                    peerReviewAssignmentDao.findByAssignmentId(assignmentId);
            List<PeerReview> reviews = peerReviewDao.findByAssignmentId(assignmentId);

            return new MonitoringSnapshot(
                    course,
                    assignment,
                    calculator.calculate(groups, submissions, reviewAssignments, reviews)
            );
        } catch (DataAccessException exception) {
            throw dashboardLoadException();
        }
    }

    private User requireLecturer(Long lecturerId) {
        if (lecturerId == null) {
            throw new UnauthorizedException();
        }
        User user = userDao.findById(lecturerId).orElseThrow(UnauthorizedException::new);
        if (user.getUserRole() != UserRole.LECTURER) {
            throw new ForbiddenException();
        }
        return user;
    }

    private Assignment requireOwnedAssignment(
            Long expectedCourseId,
            Long assignmentId,
            Long lecturerId
    ) {
        if (assignmentId == null) {
            throw new NotFoundException();
        }
        Assignment assignment = assignmentDao.findByIdWithCourseAndLecturer(assignmentId)
                .orElseThrow(NotFoundException::new);
        if (assignment.getLesson() == null || assignment.getLesson().getCourse() == null) {
            throw new NotFoundException();
        }

        Course course = assignment.getLesson().getCourse();
        if (expectedCourseId != null && !expectedCourseId.equals(course.getId())) {
            throw new NotFoundException();
        }
        if (course.getLecturer() == null
                || course.getLecturer().getId() == null
                || !course.getLecturer().getId().equals(lecturerId)) {
            throw new ForbiddenException();
        }
        return assignment;
    }

    private ApiException dashboardLoadException() {
        return new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, DASHBOARD_LOAD_ERROR_MESSAGE);
    }

    private ApiException reviewEvidenceException() {
        return new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, REVIEW_EVIDENCE_ERROR_MESSAGE);
    }

    private record MonitoringSnapshot(
            Course course,
            Assignment assignment,
            ProgressStatisticsCalculator.CalculationResult calculation
    ) {
    }
}
