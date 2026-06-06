package com.monopoly.iot.dto;

public class WonTournamentDTO {
    private Long id;
    private String name;
    private String date;
    private int participants;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public int getParticipants() { return participants; }
    public void setParticipants(int participants) { this.participants = participants; }
}
