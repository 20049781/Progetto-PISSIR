package com.monopoly.iot.dto;

public class LiveEventDTO {
    private String time;
    private String type; // Tipi possibili: "SYSTEM", "ASSET", "ERROR"
    private String source; // es. "Nexus-04"
    private String message;

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
