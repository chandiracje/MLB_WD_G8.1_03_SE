package com.lankafresh.supermarket.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne
    @JoinColumn(name = "delivery_staff_id")
    private User deliveryStaff;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryStatus status;

    @Column(name = "estimated_time")
    private LocalDateTime estimatedTime;

    @Column(name = "actual_time")
    private LocalDateTime actualTime;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "route_name", length = 100)
    private String routeName;

    @Column(name = "route_stop_order")
    private Integer routeStopOrder;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;
}
