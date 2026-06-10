package edu.hcmute.peergradehub.result.model;

import edu.hcmute.peergradehub.assignment.model.Assignment;
import edu.hcmute.peergradehub.group.model.StudentGroup;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "assignment_results",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_assignment_results_assignment_group", columnNames = {"assignment_id", "group_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AssignmentResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_result_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private StudentGroup group;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "score", nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean hasValidScore() {
        return score != null
                && score.compareTo(BigDecimal.ZERO) >= 0
                && score.compareTo(BigDecimal.valueOf(100)) <= 0;
    }
}
