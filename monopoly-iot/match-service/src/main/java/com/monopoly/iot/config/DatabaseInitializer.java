package com.monopoly.iot.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS tournament_venues (" +
                "tournament_id INTEGER NOT NULL, " +
                "venue_id INTEGER NOT NULL, " +
                "PRIMARY KEY (tournament_id, venue_id)" +
                ")");
        
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS player_statistics (" +
                "user_id INTEGER PRIMARY KEY, " +
                "matches_played INTEGER DEFAULT 0, " +
                "matches_won INTEGER DEFAULT 0, " +
                "total_earnings INTEGER DEFAULT 0, " +
                "total_spent INTEGER DEFAULT 0, " +
                "tournaments_played INTEGER DEFAULT 0, " +
                "tournaments_won INTEGER DEFAULT 0, " +
                "last_updated_at TEXT" +
                ")");
        
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS game_table_statistics (" +
                "game_table_id INTEGER PRIMARY KEY, " +
                "matches_played INTEGER DEFAULT 0, " +
                "total_events INTEGER DEFAULT 0, " +
                "last_updated_at TEXT" +
                ")");
        
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS venue_statistics (" +
                "venue_id INTEGER PRIMARY KEY, " +
                "matches_hosted INTEGER DEFAULT 0, " +
                "tournaments_hosted INTEGER DEFAULT 0, " +
                "active_tables INTEGER DEFAULT 0, " +
                "last_updated_at TEXT" +
                ")");
    }
}
