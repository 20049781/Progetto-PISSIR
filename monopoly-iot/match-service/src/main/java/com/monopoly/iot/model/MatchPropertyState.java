package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "match_property_state")
public class MatchPropertyState {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "owner_match_player_id")
    private Long ownerMatchPlayerId;

    @Column(nullable = false)
    private Integer mortgaged;

    @Column(nullable = false)
    private Integer houses;

    @Column(nullable = false)
    private Integer hotels;

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

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public Long getOwnerMatchPlayerId() {
        return ownerMatchPlayerId;
    }

    public void setOwnerMatchPlayerId(Long ownerMatchPlayerId) {
        this.ownerMatchPlayerId = ownerMatchPlayerId;
    }

    public Integer getMortgaged() {
        return mortgaged;
    }

    public void setMortgaged(Integer mortgaged) {
        this.mortgaged = mortgaged;
    }

    public Integer getHouses() {
        return houses;
    }

    public void setHouses(Integer houses) {
        this.houses = houses;
    }

    public Integer getHotels() {
        return hotels;
    }

    public void setHotels(Integer hotels) {
        this.hotels = hotels;
    }

}
