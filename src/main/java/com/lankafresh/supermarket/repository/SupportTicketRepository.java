package com.lankafresh.supermarket.repository;

import com.lankafresh.supermarket.entity.SupportTicket;
import com.lankafresh.supermarket.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
    List<SupportTicket> findByStatus(TicketStatus status);
}
