package com.lankafresh.supermarket.controller;

import com.lankafresh.supermarket.entity.SupportTicket;
import com.lankafresh.supermarket.entity.TicketReply;
import com.lankafresh.supermarket.entity.TicketStatus;
import com.lankafresh.supermarket.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    @PostMapping("/{userId}")
    public ResponseEntity<?> createTicket(@PathVariable Long userId, @RequestBody SupportTicket ticket) {
        try {
            SupportTicket created = supportTicketService.createTicket(userId, ticket);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SupportTicket>> getTicketsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(supportTicketService.getTicketsByUser(userId));
    }

    @GetMapping
    public ResponseEntity<List<SupportTicket>> getAllTickets() {
        return ResponseEntity.ok(supportTicketService.getAllTickets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(supportTicketService.getTicketById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam TicketStatus status) {
        try {
            SupportTicket updated = supportTicketService.updateTicketStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<?> addReply(@PathVariable Long id, @RequestBody TicketReply reply) {
        try {
            TicketReply savedReply = supportTicketService.addReply(id, reply);
            return ResponseEntity.ok(savedReply);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/replies")
    public ResponseEntity<List<TicketReply>> getReplies(@PathVariable Long id) {
        return ResponseEntity.ok(supportTicketService.getRepliesByTicket(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
        try {
            supportTicketService.deleteTicket(id);
            return ResponseEntity.ok(Map.of("message", "Support ticket deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
