package com.monopoly.iot.dto;

import java.util.List;

public class BoardStatusDTO {
    private String boardName;
    private String status; // Stati possibili: "IN_MATCH", "ONLINE", "OFFLINE"
    private int currentPlayers;
    private int maxPlayers;
    private String duration;
    private List<String> playerAvatars;
    private Long matchId;

    public String getBoardName() { return boardName; }
    public void setBoardName(String boardName) { this.boardName = boardName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCurrentPlayers() { return currentPlayers; }
    public void setCurrentPlayers(int currentPlayers) { this.currentPlayers = currentPlayers; }
    public int getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(int maxPlayers) { this.maxPlayers = maxPlayers; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public List<String> getPlayerAvatars() { return playerAvatars; }
    public void setPlayerAvatars(List<String> playerAvatars) { this.playerAvatars = playerAvatars; }
    public Long getMatchId() { return matchId; }
    public void setMatchId(Long matchId) { this.matchId = matchId; }
}
