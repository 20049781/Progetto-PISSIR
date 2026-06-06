package com.monopoly.iot.dto;

import java.util.List;

public class VenueDashboardDTO {
    private String venueName;
    private int matchesToday;
    private int matchesTrend; // Percentuale, es. +12
    private String topBoardName;
    private int topBoardOccupancy; // Range 0-100
    private List<BoardStatusDTO> activeBoards;
    private List<LiveEventDTO> liveEvents;

    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }
    public int getMatchesToday() { return matchesToday; }
    public void setMatchesToday(int matchesToday) { this.matchesToday = matchesToday; }
    public int getMatchesTrend() { return matchesTrend; }
    public void setMatchesTrend(int matchesTrend) { this.matchesTrend = matchesTrend; }
    public String getTopBoardName() { return topBoardName; }
    public void setTopBoardName(String topBoardName) { this.topBoardName = topBoardName; }
    public int getTopBoardOccupancy() { return topBoardOccupancy; }
    public void setTopBoardOccupancy(int topBoardOccupancy) { this.topBoardOccupancy = topBoardOccupancy; }
    public List<BoardStatusDTO> getActiveBoards() { return activeBoards; }
    public void setActiveBoards(List<BoardStatusDTO> activeBoards) { this.activeBoards = activeBoards; }
    public List<LiveEventDTO> getLiveEvents() { return liveEvents; }
    public void setLiveEvents(List<LiveEventDTO> liveEvents) { this.liveEvents = liveEvents; }
}
