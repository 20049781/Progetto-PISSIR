package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tournament_players")
public class TournamentPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tournament_id")
    private Long tournamentId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "registered_at")
    private String registeredAt;

    private Integer points;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTournamentId() { return tournamentId; }
    public void setTournamentId(Long tournamentId) { this.tournamentId = tournamentId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(String registeredAt) { this.registeredAt = registeredAt; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
}
