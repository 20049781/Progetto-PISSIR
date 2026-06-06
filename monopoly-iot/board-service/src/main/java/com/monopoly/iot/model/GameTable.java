package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "game_tables")
public class GameTable {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "venue_id", nullable = false)
    private Long venueId;

    @Column(nullable = false)
    private String status;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "table_code")
    private String tableCode;

    @Column(name = "game_type_id")
    private Long gameTypeId = 1L; // Default to 1 (Monopoly)

    public Long getGameTypeId() {
        return gameTypeId;
    }

    public void setGameTypeId(Long gameTypeId) {
        this.gameTypeId = gameTypeId;
    }
    public String getTableCode() {
        return tableCode;
    }

    public void setTableCode(String tableCode) {
        this.tableCode = tableCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVenueId() {
        return venueId;
    }

    public void setVenueId(Long venueId) {
        this.venueId = venueId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

}
