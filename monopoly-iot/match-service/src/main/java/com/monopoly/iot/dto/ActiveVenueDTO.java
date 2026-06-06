package com.monopoly.iot.dto;

public class ActiveVenueDTO {
    private String name;
    private double activityScore;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getActivityScore() { return activityScore; }
    public void setActivityScore(double activityScore) { this.activityScore = activityScore; }
}
