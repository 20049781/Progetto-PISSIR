package com.monopoly.iot.controller;

import com.monopoly.iot.model.User;
import com.monopoly.iot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository repository;

    @GetMapping
    public List<User> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public User create(@RequestBody User entity) {
        return repository.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User details) {
        return repository.findById(id).map(existing -> {
            return ResponseEntity.ok(repository.save(details));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return repository.findById(id).map(existing -> {
            repository.delete(existing);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/wants-tournament")
    public ResponseEntity<User> setWantsTournament(@PathVariable Long id, @RequestParam boolean wants) {
        return repository.findById(id).map(user -> {
            user.setWantsTournament(wants);
            return ResponseEntity.ok(repository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<User> updateProfile(@PathVariable Long id, @RequestBody User profileDetails) {
        return repository.findById(id).map(user -> {
            if (profileDetails.getUsername() != null && !profileDetails.getUsername().trim().isEmpty()) {
                user.setUsername(profileDetails.getUsername());
            }
            user.setFullName(profileDetails.getFullName());
            user.setBio(profileDetails.getBio());
            user.setGender(profileDetails.getGender());
            user.setAge(profileDetails.getAge());
            user.setAvatar(profileDetails.getAvatar());
            return ResponseEntity.ok(repository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/notice")
    public ResponseEntity<User> setNotice(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        String notice = payload.get("notice");
        return repository.findById(id).map(user -> {
            user.setAdminNotice(notice);
            return ResponseEntity.ok(repository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/notice")
    public ResponseEntity<User> clearNotice(@PathVariable Long id) {
        return repository.findById(id).map(user -> {
            user.setAdminNotice(null);
            return ResponseEntity.ok(repository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<String> changePassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");
        
        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Password corrente o nuova mancante");
        }
        
        return repository.findById(id).map(user -> {
            if (!user.getPasswordHash().equals(currentPassword)) {
                return ResponseEntity.badRequest().body("La password corrente non è corretta");
            }
            user.setPasswordHash(newPassword);
            repository.save(user);
            return ResponseEntity.ok("Password modificata con successo!");
        }).orElse(ResponseEntity.notFound().build());
    }
}
