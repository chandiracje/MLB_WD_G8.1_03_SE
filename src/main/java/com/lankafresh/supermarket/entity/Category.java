package com.lankafresh.supermarket.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties("parent")
    private Category parent;

    // Convenience getter so JSON serialization includes parentId directly
    @Transient
    public Long getParentId() {
        return parent != null ? parent.getId() : null;
    }

    // Convenience getter so JSON serialization includes parentName
    @Transient
    public String getParentName() {
        return parent != null ? parent.getName() : null;
    }
}
