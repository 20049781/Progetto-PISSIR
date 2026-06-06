package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "game_settings")
public class GameSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "initial_balance", nullable = false)
    private Integer initialBalance = 1500;

    @Column(name = "max_players", nullable = false)
    private Integer maxPlayers = 4;

    @Column(name = "sensor_mode_active", nullable = false)
    private Boolean sensorModeActive = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getInitialBalance() {
        return initialBalance;
    }

    public void setInitialBalance(Integer initialBalance) {
        this.initialBalance = initialBalance;
    }

    public Integer getMaxPlayers() {
        return maxPlayers;
    }

    public void setMaxPlayers(Integer maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public Boolean getSensorModeActive() {
        return sensorModeActive;
    }

    public void setSensorModeActive(Boolean sensorModeActive) {
        this.sensorModeActive = sensorModeActive;
    }
}
