
-- FuelCharge Pro - Database Schema

CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    credit_limit DECIMAL(12, 2) DEFAULT 0.00,
    current_balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50),
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status ENUM('UNPAID', 'PAID', 'OVERDUE') DEFAULT 'UNPAID',
    email_sent BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(50),
    description TEXT NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50),
    date DATE NOT NULL,
    type ENUM('FUEL', 'STORE', 'PAYMENT') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    station_name VARCHAR(255) DEFAULT 'Main St Fuel & C-Store',
    station_id VARCHAR(50) DEFAULT 'ST-9921',
    support_email VARCHAR(255) DEFAULT 'billing@mainstfuel.com',
    auto_generate BOOLEAN DEFAULT TRUE,
    payment_terms INT DEFAULT 15,
    tax_rate DECIMAL(5, 2) DEFAULT 7.25,
    smtp_host VARCHAR(255),
    smtp_port INT DEFAULT 587,
    smtp_user VARCHAR(255),
    smtp_pass VARCHAR(255)
);

INSERT IGNORE INTO settings (id) VALUES (1);
