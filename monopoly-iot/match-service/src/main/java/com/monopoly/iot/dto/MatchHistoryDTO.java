package com.monopoly.iot.dto;

public class MatchHistoryDTO {
    private String id;
    private String name;
    private String duration;
    private String revenue;
    private String outcome;
    private boolean isVictory;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getRevenue() { return revenue; }
    public void setRevenue(String revenue) { this.revenue = revenue; }
    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public boolean isVictory() { return isVictory; }
    public void setVictory(boolean isVictory) { this.isVictory = isVictory; }
}
