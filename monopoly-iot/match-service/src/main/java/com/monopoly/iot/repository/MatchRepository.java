package com.monopoly.iot.repository;

import com.monopoly.iot.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    java.util.List<Match> findByStatus(String status);
}
