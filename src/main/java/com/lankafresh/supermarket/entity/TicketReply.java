package com.lankafresh.supermarket.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_replies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketReply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    @JsonIgnoreProperties({"replies", "user"})
    private SupportTicket ticket;

    @Column(name = "sender_role", length = 30) // "SUPPORT", "CUSTOMER"
    private String senderRole;

    @Column(name = "sender_name", length = 100)
    private String senderName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
