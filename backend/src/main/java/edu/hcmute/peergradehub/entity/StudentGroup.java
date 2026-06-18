package edu.hcmute.peergradehub.entity;

import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "student_groups",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_groups_course_name", columnNames = {"course_id", "group_name"})
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class StudentGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "group_id")
    private Long id;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    @Column(name = "max_members", nullable = false)
    private Integer maxMembers;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(name = "group_status", nullable = false, length = 30)
    @Builder.Default
    private GroupStatus groupStatus = GroupStatus.FORMING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean hasCapacity(int currentMemberCount) {
        return maxMembers != null && currentMemberCount >= 0 && currentMemberCount < maxMembers;
    }
}
