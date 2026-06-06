package com.monopoly.iot.gateway;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;

@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS, RequestMethod.PATCH})
@RestController
public class GatewayController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, String> routes = new HashMap<>();

    public GatewayController() {
        routes.put("/api/users", "http://localhost:8081");
        routes.put("/api/matches", "http://localhost:8082");
        routes.put("/api/reading-zones", "http://localhost:8083");
        routes.put("/api/game-tables", "http://localhost:8083");
        routes.put("/api/gametables", "http://localhost:8083");
        routes.put("/api/venues", "http://localhost:8083");
        routes.put("/api/tournaments", "http://localhost:8082");
        routes.put("/api/sensor-events", "http://localhost:8085");
        routes.put("/api/sync", "http://localhost:8085");
        routes.put("/api/analytics", "http://localhost:8082");
        routes.put("/api/game-settings", "http://localhost:8082");
    }

    @RequestMapping(value = "/api/**")
    public ResponseEntity<?> route(HttpMethod method, HttpServletRequest request, @RequestBody(required = false) String body) throws URISyntaxException {
        String uri = request.getRequestURI();
        String targetBase = null;
        
        if (uri.matches("/api/users/[^/]+/dashboard")) {
            targetBase = "http://localhost:8082";
        } else if (uri.matches("/api/venues/dashboard/[^/]+")) {
            targetBase = "http://localhost:8082";
        } else {
            for (Map.Entry<String, String> entry : routes.entrySet()) {
                if (uri.startsWith(entry.getKey())) {
                    targetBase = entry.getValue();
                    break;
                }
            }
        }
        
        if (targetBase == null) {
            return ResponseEntity.status(404).body("Route not found for: " + uri);
        }

        String targetUrl = targetBase + uri;
        if (request.getQueryString() != null) {
            targetUrl += "?" + request.getQueryString();
        }

        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            if (!name.equalsIgnoreCase("host") 
                    && !name.equalsIgnoreCase("content-length")
                    && !name.equalsIgnoreCase("origin")
                    && !name.equalsIgnoreCase("referer")) {
                headers.set(name, request.getHeader(name));
            }
        }

        HttpEntity<String> httpEntity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(new URI(targetUrl), method, httpEntity, byte[].class);
            HttpHeaders responseHeaders = new HttpHeaders();
            if (response.getHeaders() != null) {
                response.getHeaders().forEach((headerName, headerValues) -> {
                    if (!headerName.equalsIgnoreCase("transfer-encoding") 
                            && !headerName.equalsIgnoreCase("content-length")
                            && !headerName.toLowerCase().startsWith("access-control-")) {
                        responseHeaders.put(headerName, headerValues);
                    }
                });
            }
            return new ResponseEntity<>(response.getBody(), responseHeaders, response.getStatusCode());
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            HttpHeaders responseHeaders = new HttpHeaders();
            if (e.getResponseHeaders() != null) {
                e.getResponseHeaders().forEach((headerName, headerValues) -> {
                    if (!headerName.equalsIgnoreCase("transfer-encoding") 
                            && !headerName.equalsIgnoreCase("content-length")
                            && !headerName.toLowerCase().startsWith("access-control-")) {
                        responseHeaders.put(headerName, headerValues);
                    }
                });
            }
            return ResponseEntity.status(e.getStatusCode())
                    .headers(responseHeaders)
                    .body(e.getResponseBodyAsByteArray());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Gateway error: " + e.getMessage());
        }
    }
}
