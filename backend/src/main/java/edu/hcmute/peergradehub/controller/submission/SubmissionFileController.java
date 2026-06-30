package edu.hcmute.peergradehub.controller.submission;

import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.StudentSubmissionFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequiredArgsConstructor
@RequestMapping("/submissions")
public class SubmissionFileController {

    private final StudentSubmissionFacade studentSubmissionFacade;

    @GetMapping("/{submissionId}/files/{fileId}/download")
    public ResponseEntity<Resource> downloadSubmissionFile(
            @PathVariable Long submissionId,
            @PathVariable Long fileId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        if (principal == null) {
            throw new UnauthorizedException();
        }

        StudentSubmissionFacade.DownloadedSubmissionFile file =
                studentSubmissionFacade.downloadSubmissionFile(submissionId, fileId, principal.getId());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(file.fileName(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(file.resource());
    }
}
