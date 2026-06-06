package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "matches")
public class Match {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_table_id", nullable = false)
    private Long gameTableId;

    @Column(nullable = false)
    private String status;

    @Column(name = "current_turn_player_id")
    private Long currentTurnPlayerId;

    @Column(name = "scheduled_time")
    private String scheduledTime;

    @Column(name = "max_players")
    private Integer maxPlayers;

    @Column(name = "tournament_id")
    private Long tournamentId;

    @Column(name = "winner_player_id")
    private Long winnerPlayerId;

    @Column(name = "start_time")
    private String startTime;

    @Column(name = "end_time")
    private String endTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGameTableId() {
        return gameTableId;
    }

    public void setGameTableId(Long gameTableId) {
        this.gameTableId = gameTableId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getCurrentTurnPlayerId() {
        return currentTurnPlayerId;
    }

    public void setCurrentTurnPlayerId(Long currentTurnPlayerId) {
        this.currentTurnPlayerId = currentTurnPlayerId;
    }

    public String getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(String scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public Integer getMaxPlayers() {
        return maxPlayers;
    }

    public void setMaxPlayers(Integer maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public Long getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Long tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Long getWinnerPlayerId() {
        return winnerPlayerId;
    }

    public void setWinnerPlayerId(Long winnerPlayerId) {
        this.winnerPlayerId = winnerPlayerId;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }
}
