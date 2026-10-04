package com.lankafresh.supermarket.pattern.observer;

import com.lankafresh.supermarket.entity.Order;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Concrete Observer: Finance & Accounts Ledger Observer.
 * 
 * Automatically captures revenue records upon order placement and posts reversing
 * debit/credit adjustment entries upon order cancellation.
 */
@Component
public class FinanceLedgerObserver implements OrderObserver {

    private final List<String> financeAuditLog = new CopyOnWriteArrayList<>();

    @Override
    public void update(Order order, String eventType, String message) {
        String logEntry;
        if ("ORDER_PLACED".equalsIgnoreCase(eventType)) {
            logEntry = String.format("[FINANCE LEDGER] Credit booked: Rs. %s | Order #%d [%s] via %s (%s)",
                    order != null && order.getTotalAmount() != null ? order.getTotalAmount().toPlainString() : "0.00",
                    order != null ? order.getId() : 0,
                    order != null ? order.getTrackingNumber() : "N/A",
                    order != null ? order.getPaymentMethod() : "CARD",
                    order != null ? order.getPaymentStatus() : "PAID");
        } else if ("ORDER_CANCELLED".equalsIgnoreCase(eventType) || "CANCELLED".equalsIgnoreCase(eventType)) {
            logEntry = String.format("[FINANCE LEDGER] Debit reversal: Rs. %s for Cancelled Order #%d [%s]",
                    order != null && order.getTotalAmount() != null ? order.getTotalAmount().toPlainString() : "0.00",
                    order != null ? order.getId() : 0,
                    order != null ? order.getTrackingNumber() : "N/A");
        } else {
            logEntry = String.format("[FINANCE AUDIT] Audit entry recorded: Order #%d [%s] -> %s",
                    order != null ? order.getId() : 0,
                    order != null ? order.getTrackingNumber() : "N/A",
                    eventType);
        }

        financeAuditLog.add(logEntry);
        System.out.println(logEntry);
    }

    @Override
    public String getObserverName() {
        return "FinanceLedgerObserver (Accounts & Audit Ledger)";
    }

    public List<String> getFinanceAuditLog() {
        return Collections.unmodifiableList(financeAuditLog);
    }

    public void clearLog() {
        financeAuditLog.clear();
    }
}
