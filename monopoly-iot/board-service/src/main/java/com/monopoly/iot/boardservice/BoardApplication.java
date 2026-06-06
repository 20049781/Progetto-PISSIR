package com.monopoly.iot.boardservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.monopoly.iot")
@EnableJpaRepositories(basePackages = "com.monopoly.iot.repository")
@EntityScan(basePackages = "com.monopoly.iot.model")
public class BoardApplication {
    public static void main(String[] args) {
        SpringApplication.run(BoardApplication.class, args);
    }
}

