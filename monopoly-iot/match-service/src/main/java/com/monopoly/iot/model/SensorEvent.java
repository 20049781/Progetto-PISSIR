package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "sensor_events")
public class SensorEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id")
    private Long matchId;

    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    @Column(name = "tagged_object_id")
    private Long taggedObjectId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "raw_payload")
    private String rawPayload;

    @Column(name = "detected_at")
    private String detectedAt;

    @Column(nullable = false)
    private Integer processed;

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

    public Long getZoneId() {
        return zoneId;
    }

    public void setZoneId(Long zoneId) {
        this.zoneId = zoneId;
    }

    public Long getTaggedObjectId() {
        return taggedObjectId;
    }

    public void setTaggedObjectId(Long taggedObjectId) {
        this.taggedObjectId = taggedObjectId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getRawPayload() {
        return rawPayload;
    }

    public void setRawPayload(String rawPayload) {
        this.rawPayload = rawPayload;
    }

    public String getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(String detectedAt) {
        this.detectedAt = detectedAt;
    }

    public Integer getProcessed() {
        return processed;
    }

    public void setProcessed(Integer processed) {
        this.processed = processed;
    }

}
