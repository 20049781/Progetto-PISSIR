package com.monopoly.iot.dto;

import java.util.List;

public class GlobalLeaderboardDTO {
    private List<LeaderboardPlayerDTO> topPlayers;
    private List<LeaderboardPlayerDTO> allPlayers;
    private int totalMatchesToday;
    private String topVenue;

    public List<LeaderboardPlayerDTO> getTopPlayers() { return topPlayers; }
    public void setTopPlayers(List<LeaderboardPlayerDTO> topPlayers) { this.topPlayers = topPlayers; }
    public List<LeaderboardPlayerDTO> getAllPlayers() { return allPlayers; }
    public void setAllPlayers(List<LeaderboardPlayerDTO> allPlayers) { this.allPlayers = allPlayers; }
    public int getTotalMatchesToday() { return totalMatchesToday; }
    public void setTotalMatchesToday(int totalMatchesToday) { this.totalMatchesToday = totalMatchesToday; }
    public String getTopVenue() { return topVenue; }
    public void setTopVenue(String topVenue) { this.topVenue = topVenue; }
}
