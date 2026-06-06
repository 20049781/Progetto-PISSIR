package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "match_players")
public class MatchPlayer {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "player_order", nullable = false)
    private Integer playerOrder;

    @Column(name = "current_balance", nullable = false)
    private Integer currentBalance;

    @Column(name = "in_game", nullable = false)
    private Integer inGame;

    @Column(nullable = false)
    private Integer bankrupt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getPlayerOrder() {
        return playerOrder;
    }

    public void setPlayerOrder(Integer playerOrder) {
        this.playerOrder = playerOrder;
    }

    public Integer getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(Integer currentBalance) {
        this.currentBalance = currentBalance;
    }

    public Integer getInGame() {
        return inGame;
    }

    public void setInGame(Integer inGame) {
        this.inGame = inGame;
    }

    public Integer getBankrupt() {
        return bankrupt;
    }

    public void setBankrupt(Integer bankrupt) {
        this.bankrupt = bankrupt;
    }

}
