package com.monopoly.iot.dto;

public class UpcomingTournamentDTO {
    private String name;
    private String time;
    private boolean active;
    private Long matchId;
    private String scheduledTime;
    private boolean joined;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Long getMatchId() { return matchId; }
    public void setMatchId(Long matchId) { this.matchId = matchId; }
    public String getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }
    public boolean isJoined() { return joined; }
    public void setJoined(boolean joined) { this.joined = joined; }
}

