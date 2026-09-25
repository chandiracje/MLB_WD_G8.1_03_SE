package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.entity.SupportTicket;
import com.lankafresh.supermarket.entity.TicketReply;
import com.lankafresh.supermarket.entity.TicketStatus;
import com.lankafresh.supermarket.entity.User;
import com.lankafresh.supermarket.repository.SupportTicketRepository;
import com.lankafresh.supermarket.repository.TicketReplyRepository;
import com.lankafresh.supermarket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final TicketReplyRepository ticketReplyRepository;
    private final UserRepository userRepository;

    @Transactional
    public SupportTicket createTicket(Long userId, SupportTicket ticket) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        ticket.setUser(user);
        ticket.setStatus(TicketStatus.OPEN);
        return supportTicketRepository.save(ticket);
    }

    public List<SupportTicket> getTicketsByUser(Long userId) {
        return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<SupportTicket> getAllTickets() {
        return supportTicketRepository.findAllByOrderByCreatedAtDesc();
    }

    public SupportTicket getTicketById(Long ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + ticketId));
    }

    @Transactional
    public SupportTicket updateTicketStatus(Long ticketId, TicketStatus status) {
        SupportTicket ticket = getTicketById(ticketId);
        ticket.setStatus(status);
        return supportTicketRepository.save(ticket);
    }

    @Transactional
    public TicketReply addReply(Long ticketId, TicketReply reply) {
        SupportTicket ticket = getTicketById(ticketId);

        reply.setTicket(ticket);
        if (reply.getCreatedAt() == null) {
            reply.setCreatedAt(LocalDateTime.now());
        }
        if (reply.getSenderRole() == null || reply.getSenderRole().trim().isEmpty()) {
            reply.setSenderRole("SUPPORT");
        }
        if (reply.getSenderName() == null || reply.getSenderName().trim().isEmpty()) {
            reply.setSenderName("Support Agent");
        }

        // If ticket was OPEN and support replies, advance to IN_PROGRESS
        if ("SUPPORT".equalsIgnoreCase(reply.getSenderRole()) && ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            supportTicketRepository.save(ticket);
        }

        TicketReply saved = ticketReplyRepository.save(reply);
        return saved;
    }

    public List<TicketReply> getRepliesByTicket(Long ticketId) {
        return ticketReplyRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public void deleteTicket(Long ticketId) {
        if (!supportTicketRepository.existsById(ticketId)) {
            throw new RuntimeException("Ticket not found with ID: " + ticketId);
        }
        supportTicketRepository.deleteById(ticketId);
    }
}
