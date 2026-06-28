package edu.hcmute.peergradehub.controller.result;

import edu.hcmute.peergradehub.common.response.ApiResponse;
import edu.hcmute.peergradehub.dto.response.result.PublishedResultResponse;
import edu.hcmute.peergradehub.security.CustomUserPrincipal;
import edu.hcmute.peergradehub.service.ResultViewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/results")
@RequiredArgsConstructor
@Slf4j
public class ResultViewController {

    private final ResultViewService resultViewService;

    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<ApiResponse<PublishedResultResponse>> getPublishedResults(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long assignmentId) {

        log.info("GET /results/assignment/{} - student: {}", assignmentId, principal.getUsername());

        PublishedResultResponse response = resultViewService.getPublishedResults(
                principal.getId(),
                assignmentId
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}