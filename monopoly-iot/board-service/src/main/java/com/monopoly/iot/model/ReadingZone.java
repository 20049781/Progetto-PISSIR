package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "reading_zones")
public class ReadingZone {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_table_id", nullable = false)
    private Long gameTableId;

    @Column(name = "zone_code", nullable = false)
    private String zoneCode;

    @Column(name = "zone_name", nullable = false)
    private String zoneName;

    @Column(name = "zone_type", nullable = false)
    private String zoneType;

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

    public String getZoneCode() {
        return zoneCode;
    }

    public void setZoneCode(String zoneCode) {
        this.zoneCode = zoneCode;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public String getZoneType() {
        return zoneType;
    }

    public void setZoneType(String zoneType) {
        this.zoneType = zoneType;
    }

    @Column(name = "player_slot")
    private Integer playerSlot;

    public Integer getPlayerSlot() {
        return playerSlot;
    }

    public void setPlayerSlot(Integer playerSlot) {
        this.playerSlot = playerSlot;
    }

}
