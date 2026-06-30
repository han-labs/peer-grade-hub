package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.AssignmentSubmissionDao;
import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.CourseEnrollmentDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.SubmissionAttachmentDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.submission.SubmissionLinkRequest;
import edu.hcmute.peergradehub.dto.request.submission.SubmitAssignmentRequest;
import edu.hcmute.peergradehub.dto.response.submission.AssignmentSubmissionPageResponse;
import edu.hcmute.peergradehub.dto.response.submission.AssignmentSubmissionResponse;
import edu.hcmute.peergradehub.dto.response.submission.StudentSubmittableAssignmentResponse;
import edu.hcmute.peergradehub.dto.response.submission.SubmissionAttachmentResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.CourseEnrollment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.SubmissionAttachment;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionAttachmentType;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ConflictException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.service.StudentSubmissionFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Locale;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import edu.hcmute.peergradehub.dao.AssignmentResultDao;
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentSubmissionFacadeImpl implements StudentSubmissionFacade {

    private static final String NOT_IN_GROUP_MESSAGE =
            "You must join a group before submitting this assignment.";
    private static final String DEADLINE_PASSED_MESSAGE =
            "Submission deadline has passed. You can no longer submit this assignment.";
    private static final String DELETE_DEADLINE_PASSED_MESSAGE =
            "Submission deadline has passed. You can no longer delete this submission.";
    private static final String SUBMIT_SUCCESS_MESSAGE =
            "Assignment submitted successfully.";
    private static final String NO_CURRENT_SUBMISSION_MESSAGE =
            "No submission has been created yet.";
    private static final String INVALID_FILE_TYPE_MESSAGE =
            "Invalid file type. Please upload only the file types allowed by the lecturer.";
    private static final String FILE_TOO_LARGE_MESSAGE =
            "File size exceeds the allowed limit. Please upload a smaller file or contact your lecturer.";
    private static final String FILE_UNAVAILABLE_MESSAGE =
            "File is not available for download.";
    private static final long BYTES_PER_MB = 1024L * 1024L;
    private static final Set<String> ALLOWED_FILE_TYPES = Set.of(
            "pdf",
            "doc",
            "docx",
            "ppt",
            "pptx",
            "txt",
            "png",
            "jpg",
            "jpeg",
            "zip",
            "rar"
    );

    private final UserDao userDao;
    private final AssignmentDao assignmentDao;
    private final CourseDao courseDao;
    private final CourseEnrollmentDao courseEnrollmentDao;
    private final StudentGroupDao studentGroupDao;
    private final AssignmentSubmissionDao assignmentSubmissionDao;
    private final SubmissionAttachmentDao submissionAttachmentDao;
    private final AssignmentResultDao assignmentResultDao;
    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.file.max-file-size-mb:20}")
    private long maxFileSizeMb;

    @Override
    public List<StudentSubmittableAssignmentResponse> getSubmittableAssignments(Long studentId) {
        User student = validateActiveStudent(studentId);
        List<Long> courseIds = courseEnrollmentDao.findByStudentId(student.getId())
                .stream()
                .map(CourseEnrollment::getCourse)
                .filter(course -> course != null && course.getCourseStatus() == CourseStatus.ACTIVE)
                .map(Course::getId)
                .distinct()
                .toList();

        if (courseIds.isEmpty()) {
            return List.of();
        }

        return assignmentDao.findByCourseIdIn(courseIds)
                .stream()
                .map(assignment -> toSubmittableAssignmentResponse(assignment, student.getId()))
                .sorted(Comparator
                        .comparing(
                                StudentSubmittableAssignmentResponse::submissionDeadline,
                                Comparator.nullsLast(Comparator.naturalOrder())
                        )
                        .thenComparing(StudentSubmittableAssignmentResponse::assignmentId)
                )
                .toList();
    }

    @Override
    public AssignmentSubmissionPageResponse getSubmissionPage(Long assignmentId, Long studentId) {
        User student = validateActiveStudent(studentId);
        Assignment assignment = assignmentDao.findByIdWithCourseAndLecturer(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found."));
        Course course = getCourse(assignment);

        if (!courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }

        StudentGroup group = studentGroupDao.findGroupByStudentAndCourse(student.getId(), course.getId())
                .orElseThrow(() -> new BadRequestException(NOT_IN_GROUP_MESSAGE));

        AssignmentSubmissionResponse currentSubmission = assignmentSubmissionDao
                .findByAssignmentIdAndGroupId(assignment.getId(), group.getId())
                .map(this::toSubmissionResponse)
                .orElse(null);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime submissionDeadline = assignment.getSubmissionDeadline();
        boolean deadlinePassed = submissionDeadline != null && !now.isBefore(submissionDeadline);
        long hoursRemaining = deadlinePassed || submissionDeadline == null
                ? 0L
                : Math.max(0L, Duration.between(now, submissionDeadline).toHours());
        boolean warningRed = !deadlinePassed && submissionDeadline != null && hoursRemaining <= 24L;

        return new AssignmentSubmissionPageResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                course.getId(),
                course.getCourseName(),
                group.getId(),
                group.getGroupName(),
                submissionDeadline,
                deadlinePassed,
                warningRed,
                hoursRemaining,
                List.of(),
                List.of(),
                currentSubmission
        );
    }

    private StudentSubmittableAssignmentResponse toSubmittableAssignmentResponse(
            Assignment assignment,
            Long studentId
    ) {
        Course course = getCourse(assignment);
        StudentGroup group = studentGroupDao.findGroupByStudentAndCourse(studentId, course.getId())
                .orElse(null);
        AssignmentSubmission submission = group == null
                ? null
                : assignmentSubmissionDao
                        .findByAssignmentIdAndGroupId(assignment.getId(), group.getId())
                        .orElse(null);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime submissionDeadline = assignment.getSubmissionDeadline();
        boolean deadlinePassed = submissionDeadline != null && !now.isBefore(submissionDeadline);
        long hoursRemaining = deadlinePassed || submissionDeadline == null
                ? 0L
                : Math.max(0L, Duration.between(now, submissionDeadline).toHours());
        boolean warningRed = !deadlinePassed && submissionDeadline != null && hoursRemaining <= 24L;

        return new StudentSubmittableAssignmentResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                course.getId(),
                course.getCourseName(),
                assignment.getLesson().getId(),
                assignment.getLesson().getTitle(),
                group != null ? group.getId() : null,
                group != null ? group.getGroupName() : null,
                submissionDeadline,
                deadlinePassed,
                warningRed,
                hoursRemaining,
                submission != null ? submission.getId() : null,
                submission != null && submission.getSubmissionStatus() != null
                        ? submission.getSubmissionStatus().name()
                        : null,
                submission != null ? submission.getSubmittedAt() : null,
                submission != null ? studentSubmissionUrl(submission) : null
        );
    }

    private User validateActiveStudent(Long studentId) {
        User student = userDao.findById(studentId)
                .orElseThrow(() -> new ForbiddenException("Only active students can submit assignments."));

        if (student.getUserRole() != UserRole.STUDENT || !student.isActive()) {
            throw new ForbiddenException("Only active students can submit assignments.");
        }

        return student;
    }

    private AssignmentSubmissionResponse toSubmissionResponse(AssignmentSubmission submission) {
        List<SubmissionAttachmentResponse> attachments = submissionAttachmentDao
                .findByAssignmentSubmissionId(submission.getId())
                .stream()
                .map(this::toAttachmentResponse)
                .toList();

        User submittedBy = submission.getSubmittedBy();

        return new AssignmentSubmissionResponse(
                submission.getId(),
                submission.getAssignment().getId(),
                submission.getGroup().getId(),
                submission.getGroup().getGroupName(),
                submission.getSubmissionStatus().name(),
                submission.getNote(),
                submittedBy != null ? submittedBy.getId() : null,
                submittedBy != null ? submittedBy.getFullName() : null,
                submission.getSubmittedAt(),
                attachments,
                null,
                studentSubmissionUrl(submission),
                lecturerSubmissionUrl(submission)
        );
    }

    private SubmissionAttachmentResponse toAttachmentResponse(SubmissionAttachment attachment) {
        String downloadUrl = attachment.getAttachmentType() == SubmissionAttachmentType.FILE
                ? "/api/submissions/" + attachment.getAssignmentSubmission().getId()
                + "/files/" + attachment.getId() + "/download"
                : null;
        String openUrl = attachment.getAttachmentType() == SubmissionAttachmentType.LINK
                ? attachment.getUrl()
                : downloadUrl;

        return new SubmissionAttachmentResponse(
                attachment.getId(),
                attachment.getAttachmentType() != null ? attachment.getAttachmentType().name() : null,
                attachment.getTitle(),
                attachment.getFileName(),
                attachment.getFilePath(),
                attachment.getFileSizeMb(),
                attachment.getFileType(),
                attachment.getUrl(),
                attachment.getLabel(),
                downloadUrl,
                openUrl
        );
    }

    @Override
    @Transactional
    public AssignmentSubmissionResponse submitAssignment(
            Long assignmentId,
            SubmitAssignmentRequest request,
            Long studentId
    ) {
        StudentSubmissionContext context = validateSubmissionContext(assignmentId, studentId);
        ensureSubmissionDeadlineOpen(context.assignment());

        List<SubmissionLinkRequest> links = request != null && request.links() != null
                ? request.links()
                : List.of();
        List<SubmissionAttachment> linkAttachments = links.stream()
                .map(this::toLinkAttachment)
                .toList();

        AssignmentSubmission submission = getOrCreateSubmission(context);

        submission.setAssignment(context.assignment());
        submission.setGroup(context.group());
        submission.setSubmittedBy(context.student());
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setNote(request != null ? request.note() : null);
        submission.setSubmissionStatus(SubmissionStatus.SUBMITTED);

        AssignmentSubmission savedSubmission = assignmentSubmissionDao.save(submission);
        replaceLinkAttachments(savedSubmission, linkAttachments);

        return toSubmissionResponse(savedSubmission, SUBMIT_SUCCESS_MESSAGE);
    }

    @Override
    @Transactional
    public AssignmentSubmissionResponse uploadSubmissionFiles(
            Long assignmentId,
            List<MultipartFile> files,
            Long studentId
    ) {
        StudentSubmissionContext context = validateSubmissionContext(assignmentId, studentId);
        ensureSubmissionDeadlineOpen(context.assignment());

        List<MultipartFile> uploadFiles = files != null
                ? files.stream().filter(file -> file != null && !file.isEmpty()).toList()
                : List.of();
        if (uploadFiles.isEmpty()) {
            throw new BadRequestException("No files selected for upload.");
        }

        AssignmentSubmission submission = getOrCreateSubmission(context);
        submission.setAssignment(context.assignment());
        submission.setGroup(context.group());
        submission.setSubmittedBy(context.student());
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setSubmissionStatus(SubmissionStatus.SUBMITTED);

        AssignmentSubmission savedSubmission = assignmentSubmissionDao.save(submission);
        List<SubmissionAttachment> fileAttachments = uploadFiles.stream()
                .map(file -> toStoredFileAttachment(savedSubmission, file))
                .toList();
        submissionAttachmentDao.saveAll(fileAttachments);

        return toSubmissionResponse(savedSubmission, SUBMIT_SUCCESS_MESSAGE);
    }

    private Course getCourse(Assignment assignment) {
        return assignment.getLesson().getCourse();
    }

    private void ensureSubmissionDeadlineOpen(Assignment assignment) {
        LocalDateTime now = LocalDateTime.now();
        if (assignment.getSubmissionDeadline() != null && !now.isBefore(assignment.getSubmissionDeadline())) {
            throw new ConflictException(DEADLINE_PASSED_MESSAGE);
        }
    }

    private AssignmentSubmission getOrCreateSubmission(StudentSubmissionContext context) {
        return assignmentSubmissionDao
                .findByAssignmentIdAndGroupId(context.assignment().getId(), context.group().getId())
                .orElseGet(() -> AssignmentSubmission.builder()
                        .assignment(context.assignment())
                        .group(context.group())
                        .build());
    }

    private SubmissionAttachment toLinkAttachment(SubmissionLinkRequest linkRequest) {
        String url = linkRequest != null ? trimToNull(linkRequest.url()) : null;
        if (url == null || !(url.startsWith("http://") || url.startsWith("https://"))) {
            throw new BadRequestException("Invalid submission link. Please enter a valid URL that starts with http:// or https://.");
        }

        String title = trimToNull(linkRequest.title());
        if (title == null) {
            title = url;
        }

        return SubmissionAttachment.builder()
                .attachmentType(SubmissionAttachmentType.LINK)
                .title(title)
                .url(url)
                .label(linkRequest.label())
                .build();
    }

    private void replaceLinkAttachments(
            AssignmentSubmission submission,
            List<SubmissionAttachment> attachments
    ) {
        List<SubmissionAttachment> existingAttachments = submissionAttachmentDao.findByAssignmentSubmissionId(submission.getId());
        List<SubmissionAttachment> existingLinks = existingAttachments.stream()
                .filter(attachment -> attachment.getAttachmentType() == SubmissionAttachmentType.LINK)
                .toList();
        if (!existingLinks.isEmpty()) {
            submissionAttachmentDao.deleteAll(existingLinks);
        }

        if (attachments.isEmpty()) {
            return;
        }

        attachments.forEach(attachment -> attachment.setAssignmentSubmission(submission));
        submissionAttachmentDao.saveAll(attachments);
    }

    private SubmissionAttachment toStoredFileAttachment(AssignmentSubmission submission, MultipartFile file) {
        String originalFileName = sanitizeOriginalFilename(file.getOriginalFilename());
        String fileType = normalizeFileType(null, originalFileName);
        if (fileType == null || !ALLOWED_FILE_TYPES.contains(fileType)) {
            throw new BadRequestException(INVALID_FILE_TYPE_MESSAGE);
        }

        long maxBytes = maxFileSizeMb * BYTES_PER_MB;
        if (file.getSize() <= 0 || file.getSize() > maxBytes) {
            throw new BadRequestException(FILE_TOO_LARGE_MESSAGE);
        }

        Path uploadRoot = uploadRootPath();
        Path relativePath = Path.of("submissions")
                .resolve(String.valueOf(submission.getId()))
                .resolve(UUID.randomUUID() + "_" + originalFileName)
                .normalize();
        Path submissionDir = uploadRoot
                .resolve("submissions")
                .resolve(String.valueOf(submission.getId()))
                .normalize();
        Path targetPath = uploadRoot.resolve(relativePath).normalize();

        if (!targetPath.startsWith(submissionDir)) {
            throw new BadRequestException("File could not be saved. Please try again.");
        }

        try {
            Files.createDirectories(submissionDir);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("File could not be saved. Please try again.");
        }

        double fileSizeMb = Math.max(0.01, Math.round((file.getSize() * 100.0) / BYTES_PER_MB) / 100.0);

        return SubmissionAttachment.builder()
                .assignmentSubmission(submission)
                .attachmentType(SubmissionAttachmentType.FILE)
                .title(originalFileName)
                .fileName(originalFileName)
                .filePath(relativePath.toString().replace("\\", "/"))
                .fileSizeMb(fileSizeMb)
                .fileType(fileType)
                .label("File")
                .build();
    }

    private String sanitizeOriginalFilename(String originalFileName) {
        String cleaned = StringUtils.cleanPath(
                originalFileName == null || originalFileName.isBlank()
                        ? "submission-file"
                        : originalFileName
        ).replace("\\", "/");
        int slashIndex = cleaned.lastIndexOf('/');
        if (slashIndex >= 0) {
            cleaned = cleaned.substring(slashIndex + 1);
        }
        cleaned = cleaned.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (cleaned.isBlank() || cleaned.equals(".") || cleaned.equals("..")) {
            return "submission-file";
        }
        return cleaned;
    }

    private Path uploadRootPath() {
        return Path.of(uploadDir).toAbsolutePath().normalize();
    }

    private AssignmentSubmissionResponse toSubmissionResponse(
            AssignmentSubmission submission,
            String message
    ) {
        List<SubmissionAttachmentResponse> attachments = submissionAttachmentDao
                .findByAssignmentSubmissionId(submission.getId())
                .stream()
                .map(this::toAttachmentResponse)
                .toList();

        User submittedBy = submission.getSubmittedBy();

        return new AssignmentSubmissionResponse(
                submission.getId(),
                submission.getAssignment().getId(),
                submission.getGroup().getId(),
                submission.getGroup().getGroupName(),
                submission.getSubmissionStatus().name(),
                submission.getNote(),
                submittedBy != null ? submittedBy.getId() : null,
                submittedBy != null ? submittedBy.getFullName() : null,
                submission.getSubmittedAt(),
                attachments,
                message,
                studentSubmissionUrl(submission),
                lecturerSubmissionUrl(submission)
        );
    }

    private String studentSubmissionUrl(AssignmentSubmission submission) {
        if (submission.getId() == null || submission.getAssignment() == null || submission.getGroup() == null) {
            return null;
        }
        Long courseId = getCourse(submission.getAssignment()).getId();
        return "/student/courses/" + courseId
                + "/assignments/" + submission.getAssignment().getId()
                + "/submissions/" + submission.getId();
    }

    private String lecturerSubmissionUrl(AssignmentSubmission submission) {
        if (submission.getAssignment() == null || submission.getGroup() == null) {
            return null;
        }
        Long courseId = getCourse(submission.getAssignment()).getId();
        return "/lecturer/courses/" + courseId
                + "/assignments/" + submission.getAssignment().getId()
                + "/groups/" + submission.getGroup().getId()
                + "/submission";
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeFileType(String fileType, String fileName) {
        String normalizedType = trimToNull(fileType);
        if (normalizedType == null && fileName != null && fileName.contains(".")) {
            normalizedType = fileName.substring(fileName.lastIndexOf('.') + 1);
        }
        if (normalizedType == null) {
            return null;
        }
        return normalizedType
                .replaceFirst("^\\.", "")
                .toLowerCase(Locale.ROOT);
    }

    @Override
    public AssignmentSubmissionResponse getMySubmission(Long assignmentId, Long studentId) {
        StudentSubmissionContext context = validateSubmissionContext(assignmentId, studentId);

        return findCurrentSubmissionResponse(context);
    }

    @Override
    public AssignmentSubmissionResponse getMySubmission(Long courseId, Long assignmentId, Long studentId) {
        StudentSubmissionContext context = validateSubmissionContext(courseId, assignmentId, studentId);

        return findCurrentSubmissionResponse(context);
    }

    @Override
    public AssignmentSubmissionResponse getSubmissionDetail(
            Long courseId,
            Long assignmentId,
            Long submissionId,
            Long studentId
    ) {
        StudentSubmissionContext context = validateSubmissionContext(courseId, assignmentId, studentId);
        AssignmentSubmission submission = assignmentSubmissionDao.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found."));

        if (!submission.getAssignment().getId().equals(context.assignment().getId())) {
            throw new ForbiddenException("You are not allowed to view this submission.");
        }
        if (!submission.getGroup().getId().equals(context.group().getId())) {
            throw new ForbiddenException("You are not allowed to view this submission.");
        }

        return toSubmissionResponse(submission, null);
    }

    @Override
    @Transactional
    public void deleteSubmission(Long courseId, Long assignmentId, Long submissionId, Long studentId) {
        StudentSubmissionContext context = validateSubmissionContext(courseId, assignmentId, studentId);
        AssignmentSubmission submission = assignmentSubmissionDao.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found."));

        if (!submission.getAssignment().getId().equals(context.assignment().getId())) {
            throw new ForbiddenException("You are not allowed to delete this submission.");
        }
        if (!submission.getGroup().getId().equals(context.group().getId())) {
            throw new ForbiddenException("You are not allowed to delete this submission.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime submissionDeadline = context.assignment().getSubmissionDeadline();
        if (submissionDeadline != null && !now.isBefore(submissionDeadline)) {
            throw new ConflictException(DELETE_DEADLINE_PASSED_MESSAGE);
        }

        List<SubmissionAttachment> attachments = submissionAttachmentDao.findByAssignmentSubmissionId(submission.getId());
        if (!attachments.isEmpty()) {
            submissionAttachmentDao.deleteAll(attachments);
        }
        assignmentSubmissionDao.delete(submission);
    }

    @Override
    public DownloadedSubmissionFile downloadSubmissionFile(Long submissionId, Long fileId, Long actorId) {
        User actor = userDao.findById(actorId)
                .orElseThrow(() -> new ForbiddenException("You are not allowed to download this file."));
        AssignmentSubmission submission = assignmentSubmissionDao.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found."));
        SubmissionAttachment attachment = submissionAttachmentDao.findById(fileId)
                .orElseThrow(() -> new NotFoundException("File is not available for download."));

        if (!attachment.getAssignmentSubmission().getId().equals(submission.getId())) {
            throw new ForbiddenException("You are not allowed to download this file.");
        }
        if (attachment.getAttachmentType() != SubmissionAttachmentType.FILE) {
            throw new NotFoundException(FILE_UNAVAILABLE_MESSAGE);
        }

        validateDownloadPermission(actor, submission);

        Path storedPath = resolveStoredFilePath(attachment.getFilePath());
        if (!Files.isRegularFile(storedPath) || !Files.isReadable(storedPath)) {
            throw new NotFoundException(FILE_UNAVAILABLE_MESSAGE);
        }

        try {
            Resource resource = new UrlResource(storedPath.toUri());
            String contentType = Files.probeContentType(storedPath);
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream";
            }
            return new DownloadedSubmissionFile(
                    resource,
                    attachment.getFileName() != null ? attachment.getFileName() : storedPath.getFileName().toString(),
                    contentType
            );
        } catch (IOException exception) {
            throw new NotFoundException(FILE_UNAVAILABLE_MESSAGE);
        }
    }

    private void validateDownloadPermission(User actor, AssignmentSubmission submission) {
    Course course = getCourse(submission.getAssignment());
    Assignment assignment = submission.getAssignment();
    
    // Nếu là STUDENT
    if (actor.getUserRole() == UserRole.STUDENT && actor.isActive()) {
        StudentGroup actorGroup = studentGroupDao.findGroupByStudentAndCourse(actor.getId(), course.getId())
                .orElseThrow(() -> new ForbiddenException("You are not allowed to download this file."));
        
        // Cho phép download file của group mình
        if (submission.getGroup().getId().equals(actorGroup.getId())) {
            return;
        }
        
        // ===== THÊM: Cho phép download file của group đã publish nếu showcase mode = true =====
        if (Boolean.TRUE.equals(assignment.getShowcaseMode())) {
            // Kiểm tra group này đã publish chưa
            boolean isPublished = assignmentResultDao.existsPublishedByAssignmentIdAndGroupId(
                    assignment.getId(), submission.getGroup().getId()
            );
            if (isPublished) {
                return;  // Cho phép download
            }
        }
        
        throw new ForbiddenException("You are not allowed to download this file.");
    }

    // Nếu là LECTURER
    if (actor.getUserRole() == UserRole.LECTURER && actor.isActive()
            && course.getLecturer() != null && course.getLecturer().getId().equals(actor.getId())) {
        return;
    }

    throw new ForbiddenException("You are not allowed to download this file.");
}

    private Path resolveStoredFilePath(String filePath) {
        String storedPath = trimToNull(filePath);
        if (storedPath == null) {
            throw new NotFoundException(FILE_UNAVAILABLE_MESSAGE);
        }
        
        Path uploadRoot = uploadRootPath();
        Path candidatePath = Path.of(storedPath);
        Path resolvedPath = candidatePath.isAbsolute()
                ? candidatePath.normalize()
                : uploadRoot.resolve(candidatePath).normalize();

        if (!resolvedPath.startsWith(uploadRoot)) {
            throw new NotFoundException(FILE_UNAVAILABLE_MESSAGE);
        }

        return resolvedPath;
    }

    private AssignmentSubmissionResponse findCurrentSubmissionResponse(StudentSubmissionContext context) {
        return assignmentSubmissionDao
                .findByAssignmentIdAndGroupId(context.assignment().getId(), context.group().getId())
                .map(submission -> toSubmissionResponse(submission, null))
                .orElseGet(() -> new AssignmentSubmissionResponse(
                        null,
                        context.assignment().getId(),
                        context.group().getId(),
                        context.group().getGroupName(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        List.of(),
                        NO_CURRENT_SUBMISSION_MESSAGE,
                        null,
                        null
                ));
    }

    private StudentSubmissionContext validateSubmissionContext(Long assignmentId, Long studentId) {
        User student = validateActiveStudent(studentId);
        Assignment assignment = assignmentDao.findByIdWithCourseAndLecturer(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found."));
        Course course = getCourse(assignment);

        if (!courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }

        StudentGroup group = studentGroupDao.findGroupByStudentAndCourse(student.getId(), course.getId())
                .orElseThrow(() -> new BadRequestException(NOT_IN_GROUP_MESSAGE));

        return new StudentSubmissionContext(student, assignment, course, group);
    }

    private StudentSubmissionContext validateSubmissionContext(Long courseId, Long assignmentId, Long studentId) {
        User student = validateActiveStudent(studentId);
        Course course = courseDao.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found."));
        Assignment assignment = assignmentDao.findByIdWithCourseAndLecturer(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found."));

        if (!getCourse(assignment).getId().equals(course.getId())) {
            throw new NotFoundException("Assignment not found in this course.");
        }

        if (!courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }

        StudentGroup group = studentGroupDao.findGroupByStudentAndCourse(student.getId(), course.getId())
                .orElseThrow(() -> new BadRequestException(NOT_IN_GROUP_MESSAGE));

        return new StudentSubmissionContext(student, assignment, course, group);
    }

    private record StudentSubmissionContext(
            User student,
            Assignment assignment,
            Course course,
            StudentGroup group
    ) {
    }
}
