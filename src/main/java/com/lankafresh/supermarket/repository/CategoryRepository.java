package com.lankafresh.supermarket.repository;

import com.lankafresh.supermarket.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByParentIsNull();

    @Query("SELECT c FROM Category c WHERE c.parent.id = :parentId")
    List<Category> findByParentId(@Param("parentId") Long parentId);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Category c WHERE c.parent.id = :parentId")
    boolean existsByParentId(@Param("parentId") Long parentId);
}
