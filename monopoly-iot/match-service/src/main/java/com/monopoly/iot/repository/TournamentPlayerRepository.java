package com.monopoly.iot.repository;

import com.monopoly.iot.model.TournamentPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TournamentPlayerRepository extends JpaRepository<TournamentPlayer, Long> {
    List<TournamentPlayer> findByTournamentId(Long tournamentId);
}
