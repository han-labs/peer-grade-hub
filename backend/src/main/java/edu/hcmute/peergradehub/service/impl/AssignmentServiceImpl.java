package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import edu.hcmute.peergradehub.dao.CourseEnrollmentDao;
import edu.hcmute.peergradehub.dao.AssignmentResultDao;
import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.dao.LessonDao;
import java.util.stream.Collectors;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import java.util.List;
import java.time.LocalDateTime;
import edu.hcmute.peergradehub.exception.BadRequestException;   
import edu.hcmute.peergradehub.exception.ForbiddenException;    
import edu.hcmute.peergradehub.exception.NotFoundException;    
import edu.hcmute.peergradehub.dto.request.course.CreateAssignmentRequest;
import edu.hcmute.peergradehub.dto.response.lesson.AssignmentDetailResponse;
import edu.hcmute.peergradehub.entity.LessonMaterial;
import edu.hcmute.peergradehub.entity.FileAttachment;
import edu.hcmute.peergradehub.entity.LinkAttachment;
import edu.hcmute.peergradehub.mapper.LessonMapper;
import edu.hcmute.peergradehub.mapper.CourseMapper;
import edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse;
import edu.hcmute.peergradehub.dao.UserDao;    
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.Locale;
import org.springframework.util.StringUtils;    

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentDao assignmentRepository;
    private final LessonDao lessonRepository;
    private final CourseEnrollmentDao courseEnrollmentDao;
    private final AssignmentResultDao assignmentResultDao;
    private final UserDao userDao;
    private final LessonMapper lessonMapper;
    private final CourseMapper courseMapper;

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;
    @Override
    @Transactional
    public Assignment createAssignment(String title, String description, LocalDateTime submissionDeadline,
                                       LocalDateTime reviewDeadline, Lesson lesson) {
        Assignment assignment = Assignment.builder()
                .title(title)
                .description(description)
                .submissionDeadline(submissionDeadline)
                .reviewDeadline(reviewDeadline)
                .lesson(lesson)
                .build();
        validateReviewDeadline(assignment);
        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public Assignment updateAssignment(Assignment assignment, String title, String description,
                                       LocalDateTime submissionDeadline, LocalDateTime reviewDeadline) {
        Assignment deadlineCandidate = Assignment.builder()
                .submissionDeadline(submissionDeadline)
                .reviewDeadline(reviewDeadline)
                .build();
        validateReviewDeadline(deadlineCandidate);

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

    private void validateReviewDeadline(Assignment assignment) {
        if (!assignment.hasValidReviewDeadline()) {
            throw new IllegalArgumentException("Review deadline must be after the submission deadline.");
        }
    }

    @Override
    public LessonAssignmentsResponse getStudentAssignments(Long lessonId, Long studentId) {
        // 1. Lấy lesson
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found."));
        
        // 2. Lấy course từ lesson
        Course course = lesson.getCourse();
        if (course == null) {
            throw new NotFoundException("Course not found for this lesson.");
        }
        
        // 3. Kiểm tra student đã join course chưa
        boolean isEnrolled = courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), studentId);
        if (!isEnrolled) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }
        
        // 4. Kiểm tra course ACTIVE
        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is not active.");
        }
        
        // 5. Lấy assignments của lesson
        List<Assignment> assignments = assignmentRepository.findByLessonId(lessonId);
        
        // 6. Map sang response, thêm isPublished
        List<LessonAssignmentsResponse.AssignmentSummary> assignmentSummaries = assignments.stream()
                .map(assignment -> {
                    // Kiểm tra xem assignment này đã có result published chưa
                    // Cần inject AssignmentResultDao
                    boolean isPublished = assignmentResultDao.existsPublishedByAssignmentIdAndGroupId(
                            assignment.getId(), 
                            null // Không check group, chỉ check có result nào published không
                    );
                    // Hoặc đơn giản hơn: lấy assignment và kiểm tra result
                    // Hiện tại có thể bỏ qua hoặc để false
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
                })
                .collect(Collectors.toList());
        
        return new LessonAssignmentsResponse(
                lessonId,
                lesson.getTitle(),
                course.getId(),
                course.getCourseName(),
                assignmentSummaries
        );
    }

    private static final double MAX_FILE_SIZE_MB = 20.0;
    private static final java.util.Set<String> ALLOWED_FILE_TYPES = java.util.Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "image/png",
            "image/jpeg"
    );

    @Override
    @Transactional
    public Assignment createAssignment(Long lessonId, CreateAssignmentRequest request, Long actorId) {
        if (request.title() == null || request.title().trim().isEmpty()) {
            throw new IllegalArgumentException("Assignment title is required. Please enter a title before saving.");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
        Course course = lesson.getCourse();
        if (course == null) {
            throw new NotFoundException("Course not found for this lesson");
        }

        if (!course.getLecturer().getId().equals(actorId)) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }

        if (request.submissionDeadline() == null || request.reviewDeadline() == null) {
            throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.");
        }
        if (!request.reviewDeadline().isAfter(request.submissionDeadline())) {
            throw new IllegalArgumentException("Peer review deadline must be after submission deadline. Please adjust the deadlines.");
        }

        int appealDays = request.appealDays() != null ? request.appealDays() : 7;

        try {
            Assignment assignment = Assignment.builder()
                    .title(request.title())
                    .description(request.description())
                    .submissionDeadline(request.submissionDeadline())
                    .reviewDeadline(request.reviewDeadline())
                    .appealDays(appealDays)
                    .lesson(lesson)
                    .materials(new java.util.ArrayList<>())
                    .build();

            if (request.materials() != null) {
                for (var matReq : request.materials()) {
                    if (matReq.title() == null || matReq.title().trim().isEmpty()) {
                        throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.");
                    }
                    if ("FILE".equals(matReq.materialType())) {
                        if (matReq.fileSizeMb() == null || matReq.fileSizeMb() > MAX_FILE_SIZE_MB ||
                                matReq.fileType() == null || !ALLOWED_FILE_TYPES.contains(matReq.fileType()) ||
                                matReq.fileName() == null || matReq.fileName().trim().isEmpty() ||
                                matReq.filePath() == null || matReq.filePath().trim().isEmpty()) {
                            throw new IllegalArgumentException("File upload failed. Please check the file size and format, then try again. If the problem persists, contact the administrator.");
                        }
                        FileAttachment file = new FileAttachment();
                        file.setTitle(matReq.title());
                        file.setAssignment(assignment);
                        file.setFileName(matReq.fileName());
                        file.setFilePath(matReq.filePath());
                        file.setFileSizeMb(matReq.fileSizeMb());
                        file.setFileType(matReq.fileType());
                        assignment.getMaterials().add(file);
                    } else if ("LINK".equals(matReq.materialType())) {
                        if (matReq.url() == null || matReq.url().trim().isEmpty()) {
                            throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.");
                        }
                        LinkAttachment link = new LinkAttachment();
                        link.setTitle(matReq.title());
                        link.setAssignment(assignment);
                        link.setUrl(matReq.url());
                        link.setLabel(matReq.label());
                        assignment.getMaterials().add(link);
                    } else {
                        throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.");
                    }
                }
            }

            return assignmentRepository.save(assignment);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.", e);
        }
    }

    @Override
    @Transactional
    public Assignment updateAssignment(Long assignmentId, CreateAssignmentRequest request, Long actorId) {
        if (request.title() == null || request.title().trim().isEmpty()) {
            throw new IllegalArgumentException("Assignment title is required. Please enter a title before saving.");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        Course course = assignment.getLesson().getCourse();
        if (!course.getLecturer().getId().equals(actorId)) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }

        if (request.submissionDeadline() == null || request.reviewDeadline() == null) {
            throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.");
        }
        if (!request.reviewDeadline().isAfter(request.submissionDeadline())) {
            throw new IllegalArgumentException("Peer review deadline must be after submission deadline. Please adjust the deadlines.");
        }

        int appealDays = request.appealDays() != null ? request.appealDays() : 7;

        try {
            assignment.setTitle(request.title());
            assignment.setDescription(request.description());
            assignment.setSubmissionDeadline(request.submissionDeadline());
            assignment.setReviewDeadline(request.reviewDeadline());
            assignment.setAppealDays(appealDays);

            assignment.getMaterials().clear();
            if (request.materials() != null) {
                for (var matReq : request.materials()) {
                    if (matReq.title() == null || matReq.title().trim().isEmpty()) {
                        throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.");
                    }
                    if ("FILE".equals(matReq.materialType())) {
                        if (matReq.fileSizeMb() == null || matReq.fileSizeMb() > MAX_FILE_SIZE_MB ||
                                matReq.fileType() == null || !ALLOWED_FILE_TYPES.contains(matReq.fileType()) ||
                                matReq.fileName() == null || matReq.fileName().trim().isEmpty() ||
                                matReq.filePath() == null || matReq.filePath().trim().isEmpty()) {
                            throw new IllegalArgumentException("File upload failed. Please check the file size and format, then try again. If the problem persists, contact the administrator.");
                        }
                        FileAttachment file = new FileAttachment();
                        file.setTitle(matReq.title());
                        file.setAssignment(assignment);
                        file.setFileName(matReq.fileName());
                        file.setFilePath(matReq.filePath());
                        file.setFileSizeMb(matReq.fileSizeMb());
                        file.setFileType(matReq.fileType());
                        assignment.getMaterials().add(file);
                    } else if ("LINK".equals(matReq.materialType())) {
                        if (matReq.url() == null || matReq.url().trim().isEmpty()) {
                            throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.");
                        }
                        LinkAttachment link = new LinkAttachment();
                        link.setTitle(matReq.title());
                        link.setAssignment(assignment);
                        link.setUrl(matReq.url());
                        link.setLabel(matReq.label());
                        assignment.getMaterials().add(link);
                    } else {
                        throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.");
                    }
                }
            }

            return assignmentRepository.save(assignment);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot save assignment due to invalid data. Please review the assignment information and try again.", e);
        }
    }

    @Override
    public AssignmentDetailResponse getAssignmentDetail(Long assignmentId, Long actorId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        Course course = assignment.getLesson().getCourse();
        
        boolean isLecturer = course.getLecturer().getId().equals(actorId);
        boolean isEnrolledStudent = courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), actorId);
        
        if (!isLecturer && !isEnrolledStudent) {
            throw new ForbiddenException("You are not authorized to view this assignment");
        }

        return lessonMapper.toAssignmentDetailResponse(assignment);
    }

    @Override
    @Transactional
    public void deleteAssignment(Long assignmentId, Long actorId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        Course course = assignment.getLesson().getCourse();
        if (!course.getLecturer().getId().equals(actorId)) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }
        
        if (assignmentResultDao.existsPublishedByAssignmentIdAndGroupId(assignmentId, null)) {
            throw new BadRequestException("Cannot delete assignment because grades have already been published.");
        }

        assignmentRepository.delete(assignment);
    }

    @Override
    @Transactional
    public LessonMaterialResponse uploadAssignmentFile(MultipartFile file, Long actorId) {
        User actor = userDao.findById(actorId)
                .orElseThrow(() -> new NotFoundException("Actor not found."));

        if (actor.getUserRole() != UserRole.LECTURER || actor.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("You are not authorized to perform this action.");
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is missing or empty.");
        }

        String originalFileName = cleanDisplayFileName(file.getOriginalFilename());
        String mimeType = file.getContentType();

        // Validate file type (must be in the ALLOWED_FILE_TYPES set)
        if (mimeType == null || !ALLOWED_FILE_TYPES.contains(mimeType)) {
            throw new BadRequestException("File upload failed. Please check the file size and format, then try again. If the problem persists, contact the administrator.");
        }

        long maxBytes = (long) (MAX_FILE_SIZE_MB * 1024L * 1024L);
        if (file.getSize() <= 0 || file.getSize() > maxBytes) {
            throw new BadRequestException("File upload failed. Please check the file size and format, then try again. If the problem persists, contact the administrator.");
        }

        Path uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        String safeFileName = sanitizeFilename(originalFileName);
        Path relativePath = Path.of("assignment-guidelines")
                .resolve(UUID.randomUUID() + "_" + safeFileName)
                .normalize();

        Path targetPath = uploadRoot.resolve(relativePath).normalize();

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("File could not be saved. Please try again.");
        }

        double fileSizeMb = Math.max(0.01, Math.round((file.getSize() * 100.0) / (1024.0 * 1024.0)) / 100.0);

        return new LessonMaterialResponse(
                null, // id is null
                originalFileName,
                "FILE",
                originalFileName,
                relativePath.toString().replace("\\", "/"),
                fileSizeMb,
                mimeType,
                null,
                "File"
        );
    }

    private String cleanDisplayFileName(String originalFileName) {
        String cleaned = StringUtils.cleanPath(
                originalFileName == null || originalFileName.isBlank()
                        ? "material-file"
                        : originalFileName
        ).replace("\\", "/");
        int slashIndex = cleaned.lastIndexOf('/');
        if (slashIndex >= 0) {
            cleaned = cleaned.substring(slashIndex + 1);
        }
        if (cleaned.isBlank() || cleaned.equals(".") || cleaned.equals("..")) {
            return "material-file";
        }
        return cleaned;
    }

    private String sanitizeFilename(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
