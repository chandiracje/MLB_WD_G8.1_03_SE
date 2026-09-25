-- =====================================================================
-- LankaFresh Supermarket Database - Microsoft SQL Server (MSSQL Express)
-- Converted from MySQL 8 dialect to T-SQL / SQL Server Express 2019/2022
-- =====================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'lankafresh_db')
BEGIN
    CREATE DATABASE lankafresh_db;
END
GO

USE lankafresh_db;
GO

-- 1. Users table (stores customers and all role-based staff members)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'users') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL, -- Encrypted using BCrypt
        phone NVARCHAR(15),
        address NVARCHAR(MAX),
        role NVARCHAR(30) NOT NULL, -- CUSTOMER, MANAGER, INVENTORY_STAFF, DELIVERY_STAFF, SUPPORT_STAFF, FINANCE_OFFICER
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- 2. Categories table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'categories') AND type in (N'U'))
BEGIN
    CREATE TABLE categories (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL,
        parent_id BIGINT,
        CONSTRAINT FK_Category_Parent FOREIGN KEY (parent_id) REFERENCES categories(id)
    );
END
GO

-- 3. Products table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'products') AND type in (N'U'))
BEGIN
    CREATE TABLE products (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(MAX),
        price DECIMAL(10, 2) NOT NULL,
        unit NVARCHAR(20) DEFAULT 'unit',
        stock_quantity INT DEFAULT 0,
        reorder_level INT DEFAULT 10,
        category_id BIGINT,
        image_url NVARCHAR(MAX),
        is_discontinued BIT DEFAULT 0,
        CONSTRAINT FK_Product_Category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
END
GO

-- 4. Cart table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'carts') AND type in (N'U'))
BEGIN
    CREATE TABLE carts (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Cart_User FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- 5. Cart Items table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'cart_items') AND type in (N'U'))
BEGIN
    CREATE TABLE cart_items (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        cart_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        quantity INT NOT NULL,
        CONSTRAINT FK_CartItem_Cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        CONSTRAINT FK_CartItem_Product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
END
GO

-- 6. Orders table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'orders') AND type in (N'U'))
BEGIN
    CREATE TABLE orders (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        order_date DATETIME2 DEFAULT GETDATE(),
        total_amount DECIMAL(10, 2) NOT NULL,
        status NVARCHAR(30) DEFAULT 'PLACED',
        delivery_address NVARCHAR(MAX) NOT NULL,
        delivery_slot NVARCHAR(50),
        tracking_number NVARCHAR(100),
        payment_method NVARCHAR(50),
        payment_status NVARCHAR(30),
        CONSTRAINT FK_Order_User FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- 7. Order Items table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'order_items') AND type in (N'U'))
BEGIN
    CREATE TABLE order_items (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        CONSTRAINT FK_OrderItem_Order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItem_Product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
END
GO

-- 8. Deliveries table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'deliveries') AND type in (N'U'))
BEGIN
    CREATE TABLE deliveries (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id BIGINT NOT NULL UNIQUE,
        delivery_staff_id BIGINT,
        status NVARCHAR(30) DEFAULT 'PENDING',
        estimated_time DATETIME2,
        actual_time DATETIME2,
        notes NVARCHAR(MAX),
        CONSTRAINT FK_Delivery_Order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_Delivery_Staff FOREIGN KEY (delivery_staff_id) REFERENCES users(id)
    );
END
GO

-- 9. Suppliers table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'suppliers') AND type in (N'U'))
BEGIN
    CREATE TABLE suppliers (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        contact_name NVARCHAR(100),
        email NVARCHAR(100),
        phone NVARCHAR(15),
        address NVARCHAR(MAX)
    );
END
GO

-- 10. Purchase Orders (Procurement)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'purchase_orders') AND type in (N'U'))
BEGIN
    CREATE TABLE purchase_orders (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        supplier_id BIGINT NOT NULL,
        created_by BIGINT NOT NULL,
        order_date DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(30) DEFAULT 'REQUESTED',
        total_cost DECIMAL(10, 2) NOT NULL,
        CONSTRAINT FK_PO_Supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
        CONSTRAINT FK_PO_User FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- 11. Wishlists table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'wishlists') AND type in (N'U'))
BEGIN
    CREATE TABLE wishlists (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Wishlist_User FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT FK_Wishlist_Product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
END
GO

-- 12. Support Tickets table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'support_tickets') AND type in (N'U'))
BEGIN
    CREATE TABLE support_tickets (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        subject NVARCHAR(200) NOT NULL,
        category NVARCHAR(50),
        message NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(30) DEFAULT 'OPEN',
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Support_User FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- 13. Purchase Order Items
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'purchase_order_items') AND type in (N'U'))
BEGIN
    CREATE TABLE purchase_order_items (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        purchase_order_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        quantity INT NOT NULL,
        cost_price DECIMAL(10, 2) NOT NULL,
        CONSTRAINT FK_POItem_PO FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_POItem_Product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
END
GO

-- 14. Promotions
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'promotions') AND type in (N'U'))
BEGIN
    CREATE TABLE promotions (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(MAX),
        discount_percentage DECIMAL(5, 2) NOT NULL,
        start_date DATETIME2 NOT NULL,
        end_date DATETIME2 NOT NULL,
        is_active BIT DEFAULT 1
    );
END
GO

-- 15. Stock Adjustments (Auditing)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'stock_adjustments') AND type in (N'U'))
BEGIN
    CREATE TABLE stock_adjustments (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        product_id BIGINT NOT NULL,
        adjusted_by BIGINT NOT NULL,
        quantity_change INT NOT NULL,
        reason NVARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_StockAdj_Product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT FK_StockAdj_User FOREIGN KEY (adjusted_by) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO
