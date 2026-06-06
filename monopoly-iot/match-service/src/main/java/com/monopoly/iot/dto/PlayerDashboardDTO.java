package com.monopoly.iot.dto;

import java.util.List;

public class PlayerDashboardDTO {
    private String username;
    private int ranking;
    private String tier;
    private int totalMatches;
    private String topPercentile;
    private double winLossRatio;
    private String avgBalance;
    private String stdDevBalance;
    private List<String> topAssets;
    private List<MatchHistoryDTO> recentEntries;
    private List<UpcomingTournamentDTO> upcomingTournaments;
    private List<UpcomingTournamentDTO> subscribedMatches;
    private List<WonTournamentDTO> wonTournaments;
    private boolean wantsTournament;

    public List<WonTournamentDTO> getWonTournaments() { return wonTournaments; }
    public void setWonTournaments(List<WonTournamentDTO> wonTournaments) { this.wonTournaments = wonTournaments; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public int getRanking() { return ranking; }
    public void setRanking(int ranking) { this.ranking = ranking; }
    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }
    public int getTotalMatches() { return totalMatches; }
    public void setTotalMatches(int totalMatches) { this.totalMatches = totalMatches; }
    public String getTopPercentile() { return topPercentile; }
    public void setTopPercentile(String topPercentile) { this.topPercentile = topPercentile; }
    public double getWinLossRatio() { return winLossRatio; }
    public void setWinLossRatio(double winLossRatio) { this.winLossRatio = winLossRatio; }
    public String getAvgBalance() { return avgBalance; }
    public void setAvgBalance(String avgBalance) { this.avgBalance = avgBalance; }
    public String getStdDevBalance() { return stdDevBalance; }
    public void setStdDevBalance(String stdDevBalance) { this.stdDevBalance = stdDevBalance; }
    public List<String> getTopAssets() { return topAssets; }
    public void setTopAssets(List<String> topAssets) { this.topAssets = topAssets; }
    public List<MatchHistoryDTO> getRecentEntries() { return recentEntries; }
    public void setRecentEntries(List<MatchHistoryDTO> recentEntries) { this.recentEntries = recentEntries; }
    public List<UpcomingTournamentDTO> getUpcomingTournaments() { return upcomingTournaments; }
    public void setUpcomingTournaments(List<UpcomingTournamentDTO> upcomingTournaments) { this.upcomingTournaments = upcomingTournaments; }
    public List<UpcomingTournamentDTO> getSubscribedMatches() { return subscribedMatches; }
    public void setSubscribedMatches(List<UpcomingTournamentDTO> subscribedMatches) { this.subscribedMatches = subscribedMatches; }
    public boolean isWantsTournament() { return wantsTournament; }
    public void setWantsTournament(boolean wantsTournament) { this.wantsTournament = wantsTournament; }
}
