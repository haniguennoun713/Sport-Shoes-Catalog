-- ============================================================
--  MySQL Setup  –  Sport Shoes Catalog
--  Run these commands in MySQL Workbench or the MySQL CLI
-- ============================================================

-- 1. Create the database
CREATE DATABASE IF NOT EXISTS shoes_catalog
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Select it
USE shoes_catalog;

-- 3. Create the products table
CREATE TABLE IF NOT EXISTS products (
    id          INT           AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    description TEXT          NOT NULL,
    price       FLOAT         NOT NULL,
    image_url   TEXT          NOT NULL
);

-- 4. (Optional) Seed some sample data so the catalog isn't empty
INSERT INTO products (name, description, price, image_url) VALUES
('Nike Air Max 270',
 'Lightweight everyday sneaker with a large Air unit for all-day comfort.',
 129.99,
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'),

('Adidas Ultraboost 23',
 'High-performance running shoe with responsive Boost midsole technology.',
 189.99,
 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600'),

('New Balance 574',
 'Classic heritage silhouette with ENCAP midsole cushioning.',
 89.99,
 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600'),

('Puma RS-X',
 'Retro-inspired chunky runner with multi-layered upper and bold color blocking.',
 99.99,
 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600'),

('Converse Chuck Taylor All Star',
 'Iconic high-top canvas sneaker — a timeless wardrobe essential.',
 65.00,
 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600');
