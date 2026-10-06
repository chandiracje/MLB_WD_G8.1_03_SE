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
    VALUES (1, N'Nadeesha Perera', N'manager@lankafresh.com', N'$2a$10$DIXgyP5pG0fjqMnO1hNuNe07jWyCt09T7zvpObQAyYjD3sdHZPgGa', N'0771234567', N'123 Main Street, Colombo 03', N'MANAGER');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'inventory@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (2, N'Ruwan Kumara', N'inventory@lankafresh.com', N'$2a$10$DIXgyP5pG0fjqMnO1hNuNe07jWyCt09T7zvpObQAyYjD3sdHZPgGa', N'0719876543', N'Branch Warehouse, Colombo', N'INVENTORY_STAFF');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'delivery@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (3, N'Tharindu Silva', N'delivery@lankafresh.com', N'$2a$10$DIXgyP5pG0fjqMnO1hNuNe07jWyCt09T7zvpObQAyYjD3sdHZPgGa', N'0765554321', N'Logistics Hub, Colombo', N'DELIVERY_STAFF');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'support@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (4, N'Dilini Fernando', N'support@lankafresh.com', N'$2a$10$DIXgyP5pG0fjqMnO1hNuNe07jWyCt09T7zvpObQAyYjD3sdHZPgGa', N'0752223344', N'Help Desk Office', N'SUPPORT_STAFF');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'finance@lankafresh.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (5, N'Kasun Jayasinghe', N'finance@lankafresh.com', N'$2a$10$DIXgyP5pG0fjqMnO1hNuNe07jWyCt09T7zvpObQAyYjD3sdHZPgGa', N'0724445566', N'Finance Division', N'FINANCE_OFFICER');

IF NOT EXISTS (SELECT * FROM users WHERE email = 'customer@gmail.com')
    INSERT INTO users (id, name, email, password, phone, address, role)
    VALUES (6, N'Sahan Silva', N'customer@gmail.com', N'$2a$10$DIXgyP5pG0fjqMnO1hNuNe07jWyCt09T7zvpObQAyYjD3sdHZPgGa', N'0781112233', N'45/2 Galle Road, Mount Lavinia', N'CUSTOMER');
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
    VALUES (5, N'Farm Fresh Brown Eggs (10-pack)', N'Grade A farm fresh cage-free eggs with guaranteed quality.', 560.00, N'Pack', 35, 10, 2, N'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 6)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (6, N'Ceylon Pure Green Tea 100g', N'Hand-picked premium loose-leaf Ceylon green tea with natural antioxidants.', 650.00, N'Box', 45, 15, 3, N'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 7)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (7, N'Fresh Orange Juice 1L', N'100% natural cold pressed orange juice with no added sugar.', 720.00, N'Bottle', 8, 10, 3, N'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 8)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (8, N'Artisan Sourdough Bread 450g', N'Naturally fermented crusty artisan sourdough bread baked fresh daily.', 420.00, N'Loaf', 18, 5, 4, N'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 9)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (9, N'Fresh Chicken Breast Boneless 500g', N'Tender and skinless fresh chicken breast cuts, antibiotic free.', 1150.00, N'500g Pack', 20, 6, 5, N'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 10)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (10, N'Premium Basmati Rice 5kg', N'Long-grain fragrant aged royal basmati rice for festive meals.', 2350.00, N'5kg Bag', 60, 20, 6, N'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 11)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (11, N'Nuwara Eliya Fresh Carrots 500g', N'Crisp, sweet, farm-fresh orange carrots grown in the cool climate of Nuwara Eliya.', 240.00, N'500g Pack', 45, 12, 1, N'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 12)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (12, N'Farm Fresh Ripe Tomatoes 500g', N'Juicy, vine-ripened red tomatoes ideal for salads, curries, and sauces.', 190.00, N'500g Pack', 60, 15, 1, N'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 13)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (13, N'Creamy Hass Avocados (Pack of 2)', N'Rich and buttery ripe avocados, packed with healthy fats and essential nutrients.', 650.00, N'Pack', 25, 8, 1, N'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 14)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (14, N'Fresh Green Bell Peppers (Capsicum) 250g', N'Crunchy green bell peppers with a crisp flavor for stir-fries and fresh salads.', 280.00, N'Pack', 35, 10, 1, N'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 15)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (15, N'Anchor Pure Salted Butter 227g', N'Rich, creamy grass-fed dairy butter made from 100% pure New Zealand milk.', 950.00, N'Pack', 40, 10, 2, N'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 16)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (16, N'Highland Traditional Buffalo Curd 500ml', N'Creamy and thick traditional Sri Lankan curd in an authentic clay pot.', 340.00, N'Clay Pot', 30, 8, 2, N'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 17)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (17, N'Greek Style Natural Plain Yogurt 400g', N'High-protein, thick and creamy strained Greek-style yogurt with live probiotics.', 580.00, N'Tub', 20, 6, 2, N'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 18)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (18, N'Ceylon Supreme Black Tea (50 Tea Bags)', N'Authentic single-origin Dimbula high-grown Ceylon black tea with brisk aroma.', 520.00, N'Box', 55, 15, 3, N'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 19)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (19, N'Fresh Thambili King Coconut Water 330ml', N'Natural isotonic electrolyte beverage harvested fresh from golden coconuts.', 260.00, N'Bottle', 40, 12, 3, N'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 20)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (20, N'Kotmale Mist Arabica Dark Roast Coffee 250g', N'Locally roasted highland whole Arabica coffee beans with rich dark cocoa notes.', 1450.00, N'Pack', 22, 5, 3, N'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 21)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (21, N'Golden Flaky Butter Croissants (2-pack)', N'Freshly baked French-style pastry with rich buttery layers and crisp flaky crust.', 480.00, N'Pack', 16, 6, 4, N'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 22)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (22, N'Munchee Chocolate Puff Biscuits 400g', N'Crispy cocoa puff biscuits filled with rich smooth chocolate cream.', 340.00, N'Pack', 70, 20, 4, N'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 23)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (23, N'Premium Roasted Salted Cashew Nuts 200g', N'Crisp jumbo Sri Lankan cashew nuts, oven roasted and lightly sea salted.', 1650.00, N'Pouch', 28, 8, 4, N'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 24)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (24, N'Wild Caught Yellowfin Tuna Steaks 500g', N'Sashimi-grade fresh yellowfin tuna steaks sourced sustainably from deep waters.', 1850.00, N'500g Pack', 15, 5, 5, N'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 25)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (25, N'Fresh Jumbo Tiger Prawns (Cleaned) 400g', N'Succulent ocean tiger prawns, deveined and deshelled with tail on.', 2100.00, N'Pack', 18, 5, 5, N'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 26)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (26, N'Fresh Farm Whole Chicken Curry Cut 1kg', N'Clean skin-on tender chicken pieces with bone, ideal for village curry dishes.', 1380.00, N'1kg Pack', 35, 10, 5, N'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 27)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (27, N'Fresh Atlantic Salmon Fillet 250g', N'Omega-3 rich premium skin-on pink salmon portion, pan-sear ready.', 2450.00, N'Portion', 12, 4, 5, N'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 28)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (28, N'Cold-Pressed Extra Virgin Olive Oil 500ml', N'First cold-pressed Mediterranean extra virgin olive oil with fruity aroma.', 1950.00, N'Bottle', 30, 8, 6, N'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 29)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (29, N'Pure Kithul Palm Treacle 375ml', N'100% natural wild harvested artisanal kithul palm nectar with no added sugar.', 850.00, N'Bottle', 26, 7, 6, N'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 30)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (30, N'Pure Ceylon Alba Cinnamon Quills 100g', N'True Ceylon organic Alba-grade cinnamon quills with sweet, delicate aroma.', 720.00, N'Pouch', 50, 15, 6, N'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 31)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (31, N'Organic Traditional Red Raw Rice 5kg', N'Nutrient-dense Sri Lankan unpolished red raw rice, rich in natural fiber.', 1100.00, N'5kg Bag', 40, 12, 6, N'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80', 0);

IF NOT EXISTS (SELECT * FROM products WHERE id = 32)
    INSERT INTO products (id, name, description, price, unit, stock_quantity, reorder_level, category_id, image_url, is_discontinued)
    VALUES (32, N'Rich Coconut Milk Can 400ml', N'Creamy first-extract organic coconut milk with 17% fat content, preservative-free.', 390.00, N'Can', 65, 20, 6, N'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80', 0);
SET IDENTITY_INSERT products OFF;
GO
