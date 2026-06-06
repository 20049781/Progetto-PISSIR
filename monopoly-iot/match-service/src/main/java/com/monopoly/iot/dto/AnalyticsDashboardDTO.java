package com.monopoly.iot.dto;

import java.util.List;

public class AnalyticsDashboardDTO {
    private int totalMatches;
    private int activeVenues;
    private double platformGrowth; // Percentuale
    private List<ActiveVenueDTO> mostActiveVenues;
    private String avgMatchDuration;
    private List<String> topProperties;

    public int getTotalMatches() { return totalMatches; }
    public void setTotalMatches(int totalMatches) { this.totalMatches = totalMatches; }
    public int getActiveVenues() { return activeVenues; }
    public void setActiveVenues(int activeVenues) { this.activeVenues = activeVenues; }
    public double getPlatformGrowth() { return platformGrowth; }
    public void setPlatformGrowth(double platformGrowth) { this.platformGrowth = platformGrowth; }
    public List<ActiveVenueDTO> getMostActiveVenues() { return mostActiveVenues; }
    public void setMostActiveVenues(List<ActiveVenueDTO> mostActiveVenues) { this.mostActiveVenues = mostActiveVenues; }
    public String getAvgMatchDuration() { return avgMatchDuration; }
    public void setAvgMatchDuration(String avgMatchDuration) { this.avgMatchDuration = avgMatchDuration; }
    public List<String> getTopProperties() { return topProperties; }
    public void setTopProperties(List<String> topProperties) { this.topProperties = topProperties; }
}
