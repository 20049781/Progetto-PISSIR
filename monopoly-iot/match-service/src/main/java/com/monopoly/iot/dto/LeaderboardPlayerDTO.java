package com.monopoly.iot.dto;

public class LeaderboardPlayerDTO {
    private int rank;
    private Long id;
    private String fullName;
    private String username;
    private String venueName;
    private int wins;
    private int matches;
    private int tournaments;
    private int totalScore;
    private String status;
    private String winRate;
    private boolean wantsTournament;
    private String avatar;




    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }
    public int getWins() { return wins; }
    public void setWins(int wins) { this.wins = wins; }
    public int getMatches() { return matches; }
    public void setMatches(int matches) { this.matches = matches; }
    public int getTournaments() { return tournaments; }
    public void setTournaments(int tournaments) { this.tournaments = tournaments; }
    public int getTotalScore() { return totalScore; }
    public void setTotalScore(int totalScore) { this.totalScore = totalScore; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getWinRate() { return winRate; }
    public void setWinRate(String winRate) { this.winRate = winRate; }
    public boolean isWantsTournament() { return wantsTournament; }
    public void setWantsTournament(boolean wantsTournament) { this.wantsTournament = wantsTournament; }
}
