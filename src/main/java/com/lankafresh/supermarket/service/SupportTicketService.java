package com.lankafresh.supermarket.service;

import com.lankafresh.supermarket.entity.SupportTicket;
import com.lankafresh.supermarket.entity.TicketStatus;
import com.lankafresh.supermarket.entity.User;
import com.lankafresh.supermarket.repository.SupportTicketRepository;
import com.lankafresh.supermarket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;

    @Transactional
    public SupportTicket createTicket(Long userId, SupportTicket ticket) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

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

    @Transactional
    public SupportTicket updateTicketStatus(Long ticketId, TicketStatus status) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticket.setStatus(status);
        return supportTicketRepository.save(ticket);
    }
}
