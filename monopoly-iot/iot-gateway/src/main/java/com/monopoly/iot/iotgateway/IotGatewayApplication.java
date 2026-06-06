package com.monopoly.iot.iotgateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.monopoly.iot")
@EnableJpaRepositories(basePackages = "com.monopoly.iot.repository")
@EntityScan(basePackages = "com.monopoly.iot.model")
public class IotGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(IotGatewayApplication.class, args);
    }
}

