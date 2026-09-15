-- =====================================================================
-- LankaFresh Supermarket Database - Seed Data for Microsoft SQL Server
-- =====================================================================

USE lankafresh_db;
GO

-- 1. Insert Initial Categories
SET IDENTITY_INSERT categories ON;
IF NOT EXISTS (SELECT * FROM categories WHERE id = 1)
    INSERT INTO categories (id, name, parent_id) VALUES (1, N'Fresh Produce', NULL);
IF NOT EXISTS (SELECT * FROM categories WHERE id = 2)
    INSERT INTO categories (id, name, parent_id) VALUES (2, N'Dairy & Eggs', NULL);
IF NOT EXISTS (SELECT * FROM categories WHERE id = 3)
    INSERT INTO categories (id, name, parent_id) VALUES (3, N'Beverages', NULL);
IF NOT EXISTS (SELECT * FROM categories WHERE id = 4)
    INSERT INTO categories (id, name, parent_id) VALUES (4, N'Bakery & Snacks', NULL);
IF NOT EXISTS (SELECT * FROM categories WHERE id = 5)
    INSERT INTO categories (id, name, parent_id) VALUES (5, N'Meat & Seafood', NULL);
IF NOT EXISTS (SELECT * FROM categories WHERE id = 6)
    INSERT INTO categories (id, name, parent_id) VALUES (6, N'Pantry & Staples', NULL);
SET IDENTITY_INSERT categories OFF;
GO

-- 2. Insert Initial Default Users (Password is BCrypt hash for 'password123')
SET IDENTITY_INSERT users ON;
IF NOT EXISTS (SELECT * FROM users WHERE email = 'manager@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (1, N'Nadeesha Perera', N'manager@lankafresh.com', N'$2a$10$wK1y30B2z70p7/b4pL33IeeT55xJvh8mJp6d1i3vW6b6a.k6r8hW.', N'0771234567', N'123 Main Street, Colombo 03', N'MANAGER');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'inventory@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (2, N'Ruwan Kumara', N'inventory@lankafresh.com', N'$2a$10$wK1y30B2z70p7/b4pL33IeeT55xJvh8mJp6d1i3vW6b6a.k6r8hW.', N'0719876543', N'Branch Warehouse, Colombo', N'INVENTORY_STAFF');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'delivery@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (3, N'Tharindu Silva', N'delivery@lankafresh.com', N'$2a$10$wK1y30B2z70p7/b4pL33IeeT55xJvh8mJp6d1i3vW6b6a.k6r8hW.', N'0765554321', N'Logistics Hub, Colombo', N'DELIVERY_STAFF');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'support@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (4, N'Dilini Fernando', N'support@lankafresh.com', N'$2a$10$wK1y30B2z70p7/b4pL33IeeT55xJvh8mJp6d1i3vW6b6a.k6r8hW.', N'0752223344', N'Help Desk Office', N'SUPPORT_STAFF');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'finance@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (5, N'Kasun Jayasinghe', N'finance@lankafresh.com', N'$2a$10$wK1y30B2z70p7/b4pL33IeeT55xJvh8mJp6d1i3vW6b6a.k6r8hW.', N'0724445566', N'Finance Division', N'FINANCE_OFFICER');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'customer@gmail.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (6, N'Sahan Silva', N'customer@gmail.com', N'$2a$10$wK1y30B2z70p7/b4pL33IeeT55xJvh8mJp6d1i3vW6b6a.k6r8hW.', N'0781112233', N'45/2 Galle Road, Mount Lavinia', N'CUSTOMER');
SET IDENTITY_INSERT users OFF;
GO

-- 3. Insert Initial Products
SET IDENTITY_INSERT products ON;
IF NOT EXISTS (SELECT * FROM products WHERE id = 1)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (1, N'Organic Fresh Bananas', N'Farm-fresh sweet Cavendish bananas, rich in potassium and energy.', 350.00, N'kg', 50, 15, 1, N'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 2)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (2, N'Fresh Red Apples', N'Crisp and juicy Royal Gala apples imported directly from orchards.', 780.00, N'kg', 30, 10, 1, N'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 3)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (3, N'Highland Fresh Pasteurized Milk', N'1L pure whole dairy milk rich in calcium and vitamin D.', 480.00, N'1L Bottle', 40, 12, 2, N'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 4)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (4, N'Kotmale Cheddar Cheese 200g', N'Premium aged natural cheddar cheese block with rich creamy texture.', 890.00, N'Pack', 25, 8, 2, N'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 5)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (5, N'Farm Fresh Brown Eggs (10-pack)', N'Grade A farm fresh cage-free eggs with guaranteed quality.', 560.00, N'Pack', 35, 10, 2, N'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=600&q=80', 0);
SET IDENTITY_INSERT products OFF;
GO
