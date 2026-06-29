package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.AssignmentResultDao;
import edu.hcmute.peergradehub.dao.AssignmentSubmissionDao;
import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.CourseEnrollmentDao;
import edu.hcmute.peergradehub.dao.GroupMemberDao;
import edu.hcmute.peergradehub.dao.PeerReviewAssignmentDao;
import edu.hcmute.peergradehub.dao.PeerReviewDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.response.dashboard.AdminDashboardResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.DashboardAssignmentItemResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.DashboardCourseItemResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.DashboardMetricResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.LecturerDashboardResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.StudentDashboardResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.CourseEnrollment;
import edu.hcmute.peergradehub.entity.GroupMember;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final UserDao userDao;
    private final CourseDao courseDao;
    private final StudentGroupDao studentGroupDao;
    private final AssignmentDao assignmentDao;
    private final AssignmentSubmissionDao assignmentSubmissionDao;
    private final CourseEnrollmentDao courseEnrollmentDao;
    private final GroupMemberDao groupMemberDao;
    private final PeerReviewAssignmentDao peerReviewAssignmentDao;
    private final PeerReviewDao peerReviewDao;
    private final AssignmentResultDao assignmentResultDao;

    @Override
    public AdminDashboardResponse getAdminDashboard(Long userId) {
        requireRole(userId, UserRole.ADMINISTRATOR);

        List<DashboardMetricResponse> metrics = List.of(
                metric("totalUsers", "Total users", userDao.count(), "all registered accounts"),
                metric("activeUsers", "Active users", userDao.countByStatus(UserStatus.ACTIVE), "accounts ready to use"),
                metric("lecturers", "Lecturers", userDao.countByUserRole(UserRole.LECTURER), "teaching accounts"),
                metric("students", "Students", userDao.countByUserRole(UserRole.STUDENT), "learner accounts"),
                metric("courses", "Courses", courseDao.count(), "classes in the system"),
                metric("activeCourses", "Active courses", courseDao.countByCourseStatus(CourseStatus.ACTIVE), "currently open classes"),
                metric("groups", "Groups", studentGroupDao.count(), "student groups"),
                metric("assignments", "Assignments", assignmentDao.count(), "assessment tasks")
        );

        return new AdminDashboardResponse(
                metrics,
                courseDao.findTop5ByOrderByCreatedAtDesc().stream()
                        .map(course -> toCourseItem(course, Map.of(), Map.of()))
                        .toList()
        );
    }

    @Override
    public LecturerDashboardResponse getLecturerDashboard(Long userId) {
        requireRole(userId, UserRole.LECTURER);

        List<Course> courses = courseDao.findByLecturerId(userId);
        List<Long> courseIds = courses.stream().map(Course::getId).toList();
        List<Assignment> assignments = courseIds.isEmpty()
                ? List.of()
                : assignmentDao.findByCourseIdIn(courseIds);
        List<StudentGroup> groups = courseIds.isEmpty()
                ? List.of()
                : studentGroupDao.findByCourseIdIn(courseIds);
        List<Long> assignmentIds = assignments.stream().map(Assignment::getId).toList();
        List<AssignmentSubmission> submissions = assignmentIds.isEmpty()
                ? List.of()
                : assignmentSubmissionDao.findByAssignmentIdIn(assignmentIds);
        List<PeerReviewAssignment> reviewAssignments = assignmentIds.isEmpty()
                ? List.of()
                : peerReviewAssignmentDao.findByAssignmentIdIn(assignmentIds);
        List<PeerReview> reviews = reviewAssignments.isEmpty()
                ? List.of()
                : peerReviewDao.findByPeerReviewAssignmentIdIn(
                        reviewAssignments.stream().map(PeerReviewAssignment::getId).toList()
                );

        Map<Long, Long> assignmentCountByCourseId = assignments.stream()
                .collect(Collectors.groupingBy(
                        assignment -> assignment.getLesson().getCourse().getId(),
                        Collectors.counting()
                ));
        Map<Long, Long> groupCountByCourseId = groups.stream()
                .collect(Collectors.groupingBy(
                        group -> group.getCourse().getId(),
                        Collectors.counting()
                ));

        Set<String> submittedAssignmentGroupPairs = submissions.stream()
                .filter(submission -> submission.getSubmissionStatus() == SubmissionStatus.SUBMITTED
                        || submission.getSubmissionStatus() == SubmissionStatus.LATE)
                .map(submission -> submission.getAssignment().getId() + ":" + submission.getGroup().getId())
                .collect(Collectors.toSet());
        long possibleSubmissions = assignments.stream()
                .mapToLong(assignment -> groupCountByCourseId.getOrDefault(
                        assignment.getLesson().getCourse().getId(),
                        0L
                ))
                .sum();
        long submittedGroups = submittedAssignmentGroupPairs.size();
        long pendingSubmissions = Math.max(0, possibleSubmissions - submittedGroups);
        long incompleteReviews = countIncompleteReviews(reviewAssignments, reviews);

        List<DashboardMetricResponse> metrics = List.of(
                metric("courses", "Courses", (long) courses.size(), "assigned to you"),
                metric("activeCourses", "Active courses", courseDao.countByLecturerIdAndCourseStatus(userId, CourseStatus.ACTIVE), "currently open"),
                metric("assignments", "Assignments", (long) assignments.size(), "across your courses"),
                metric("groups", "Groups", (long) groups.size(), "across your courses"),
                metric("pendingSubmissions", "Pending submissions", pendingSubmissions, "estimated from course groups and assignments"),
                metric("reviewTasks", "Peer review tasks", (long) reviewAssignments.size(), "assigned review pairs"),
                metric("incompleteReviews", "Incomplete reviews", incompleteReviews, "review tasks needing follow-up")
        );

        return new LecturerDashboardResponse(
                metrics,
                courses.stream()
                        .map(course -> toCourseItem(course, assignmentCountByCourseId, groupCountByCourseId))
                        .toList(),
                upcomingAssignments(assignments, 5)
        );
    }

    @Override
    public StudentDashboardResponse getStudentDashboard(Long userId) {
        requireRole(userId, UserRole.STUDENT);

        List<CourseEnrollment> enrollments = courseEnrollmentDao.findByStudentId(userId);
        List<Course> courses = enrollments.stream()
                .map(CourseEnrollment::getCourse)
                .toList();
        List<Long> courseIds = courses.stream().map(Course::getId).toList();
        List<GroupMember> memberships = groupMemberDao.findByUserId(userId);
        List<StudentGroup> groups = memberships.stream().map(GroupMember::getGroup).toList();
        List<Long> groupIds = groups.stream().map(StudentGroup::getId).toList();
        List<Assignment> assignments = courseIds.isEmpty()
                ? List.of()
                : assignmentDao.findByCourseIdIn(courseIds);
        List<Long> assignmentIds = assignments.stream().map(Assignment::getId).toList();
        List<AssignmentSubmission> submissions = groupIds.isEmpty()
                ? List.of()
                : assignmentSubmissionDao.findByGroupIdIn(groupIds);
        List<PeerReviewAssignment> reviewTasks = groupIds.isEmpty()
                ? List.of()
                : peerReviewAssignmentDao.findByReviewerGroupIdIn(groupIds);
        List<PeerReview> reviews = reviewTasks.isEmpty()
                ? List.of()
                : peerReviewDao.findByPeerReviewAssignmentIdIn(
                        reviewTasks.stream().map(PeerReviewAssignment::getId).toList()
                );

        Set<Long> submittedAssignmentIds = submissions.stream()
                .filter(submission -> submission.getSubmissionStatus() == SubmissionStatus.SUBMITTED
                        || submission.getSubmissionStatus() == SubmissionStatus.LATE)
                .map(submission -> submission.getAssignment().getId())
                .collect(Collectors.toSet());
        long pendingSubmissions = assignments.stream()
                .filter(assignment -> !submittedAssignmentIds.contains(assignment.getId()))
                .count();
        long pendingReviews = countIncompleteReviews(reviewTasks, reviews);
        long publishedResults = groupIds.isEmpty()
                ? 0
                : assignmentResultDao.countByGroupIdInAndPublished(groupIds, true);

        Map<Long, Long> assignmentCountByCourseId = assignments.stream()
                .collect(Collectors.groupingBy(
                        assignment -> assignment.getLesson().getCourse().getId(),
                        Collectors.counting()
                ));
        Map<Long, Long> groupCountByCourseId = groups.stream()
                .collect(Collectors.groupingBy(
                        group -> group.getCourse().getId(),
                        Collectors.counting()
                ));

        List<DashboardMetricResponse> metrics = List.of(
                metric("joinedCourses", "Joined courses", (long) courses.size(), "courses you can access"),
                metric("groups", "Current groups", (long) groups.size(), "groups you belong to"),
                metric("upcomingAssignments", "Assignments", (long) assignments.size(), "available through joined courses"),
                metric("submittedAssignments", "Submitted assignments", (long) submittedAssignmentIds.size(), "submitted by your groups"),
                metric("pendingSubmissions", "Pending submissions", pendingSubmissions, "still requiring group work"),
                metric("assignedReviews", "Assigned reviews", (long) reviewTasks.size(), "peer review tasks for your groups"),
                metric("pendingReviews", "Pending reviews", pendingReviews, "reviews still unfinished"),
                metric("publishedResults", "Published results", publishedResults, "released grade records")
        );

        return new StudentDashboardResponse(
                metrics,
                courses.stream()
                        .map(course -> toCourseItem(course, assignmentCountByCourseId, groupCountByCourseId))
                        .toList(),
                upcomingAssignments(assignments, 5)
        );
    }

    private User requireRole(Long userId, UserRole requiredRole) {
        if (userId == null) {
            throw new UnauthorizedException();
        }
        User user = userDao.findById(userId).orElseThrow(UnauthorizedException::new);
        if (user.getUserRole() != requiredRole) {
            throw new ForbiddenException();
        }
        return user;
    }

    private long countIncompleteReviews(List<PeerReviewAssignment> reviewAssignments, List<PeerReview> reviews) {
        if (reviewAssignments.isEmpty()) {
            return 0;
        }
        Map<Long, PeerReview> reviewsByAssignmentId = reviews.stream()
                .collect(Collectors.toMap(
                        review -> review.getPeerReviewAssignment().getId(),
                        Function.identity(),
                        (existing, replacement) -> existing
                ));
        return reviewAssignments.stream()
                .filter(reviewAssignment -> reviewAssignment.getReviewAssignmentStatus() != ReviewAssignmentStatus.CANCELLED)
                .filter(reviewAssignment -> {
                    PeerReview review = reviewsByAssignmentId.get(reviewAssignment.getId());
                    return review == null || review.getReviewStatus() != ReviewStatus.SUBMITTED;
                })
                .count();
    }

    private List<DashboardAssignmentItemResponse> upcomingAssignments(List<Assignment> assignments, int limit) {
        LocalDateTime now = LocalDateTime.now();
        return assignments.stream()
                .filter(assignment -> assignment.getSubmissionDeadline() != null
                        && !assignment.getSubmissionDeadline().isBefore(now))
                .sorted(Comparator.comparing(Assignment::getSubmissionDeadline))
                .limit(limit)
                .map(this::toAssignmentItem)
                .toList();
    }

    private DashboardCourseItemResponse toCourseItem(
            Course course,
            Map<Long, Long> assignmentCountByCourseId,
            Map<Long, Long> groupCountByCourseId
    ) {
        return new DashboardCourseItemResponse(
                course.getId(),
                course.getCourseName(),
                course.getClassCode(),
                course.getCourseStatus().name(),
                assignmentCountByCourseId.getOrDefault(course.getId(), 0L),
                groupCountByCourseId.getOrDefault(course.getId(), 0L)
        );
    }

    private DashboardAssignmentItemResponse toAssignmentItem(Assignment assignment) {
        Course course = assignment.getLesson().getCourse();
        return new DashboardAssignmentItemResponse(
                assignment.getId(),
                assignment.getTitle(),
                course.getCourseName(),
                course.getClassCode(),
                assignment.getSubmissionDeadline(),
                assignment.getReviewDeadline()
        );
    }

    private DashboardMetricResponse metric(String key, String label, Long value, String hint) {
        return new DashboardMetricResponse(key, label, value, hint);
    }
}
