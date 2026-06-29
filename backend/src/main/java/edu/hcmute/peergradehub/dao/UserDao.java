package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserDao extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    long countByUserRole(UserRole userRole);
    long countByStatus(UserStatus status);
}
