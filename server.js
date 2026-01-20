
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fuelcharge_pro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000
});

// Define API Router
const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        res.json({ status: 'online', database: 'connected' });
    } catch (err) {
        console.error('[HealthCheck] DB Error:', err.message);
        res.status(200).json({ 
            status: 'online', 
            database: 'unreachable', 
            error: `Database connection failed: ${err.message}` 
        });
    }
});

// Helper for Email HTML
const generateInvoiceHTML = (invoice, account, settings) => {
    const itemsHTML = (invoice.items || []).map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.price).toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${(Number(item.quantity) * Number(item.price)).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
    <div style="font-family: sans-serif; color: #334155; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #1e293b; color: white; padding: 32px;">
            <h1 style="margin: 0; font-size: 24px;">${settings.station_name}</h1>
            <p style="margin: 4px 0 0; opacity: 0.7; font-size: 14px;">Invoice: ${invoice.id}</p>
        </div>
        <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <thead>
                    <tr style="background-color: #f8fafc; font-size: 12px;">
                        <th style="padding: 12px; text-align: left;">Item</th>
                        <th style="padding: 12px; text-align: center;">Qty</th>
                        <th style="padding: 12px; text-align: right;">Price</th>
                        <th style="padding: 12px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 24px 12px 12px; text-align: right; font-weight: bold;">Total Due</td>
                        <td style="padding: 24px 12px 12px; text-align: right; font-size: 20px; font-weight: bold; color: #2563eb;">$${Number(invoice.amount).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
    `;
};

// --- ACCOUNTS ---
apiRouter.get('/accounts', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM accounts ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

apiRouter.post('/accounts', async (req, res) => {
    const { id, name, email, phone, creditLimit, createdAt } = req.body;
    try {
        await pool.execute(
            'INSERT INTO accounts (id, name, email, phone, credit_limit, current_balance, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
            [id, name, email, phone, creditLimit, createdAt]
        );
        res.status(201).json({ message: 'Account created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- INVOICES ---
apiRouter.get('/invoices', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM invoices ORDER BY date DESC');
        for (let inv of rows) {
            const [items] = await pool.execute('SELECT description, quantity, price FROM invoice_items WHERE invoice_id = ?', [inv.id]);
            inv.items = items;
        }
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

apiRouter.post('/invoices', async (req, res) => {
    const { id, accountId, date, dueDate, amount, status, items } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute('INSERT INTO invoices (id, account_id, date, due_date, amount, status) VALUES (?, ?, ?, ?, ?, ?)', [id, accountId, date, dueDate, amount, status]);
        for (let item of items) {
            await conn.execute('INSERT INTO invoice_items (invoice_id, description, quantity, price) VALUES (?, ?, ?, ?)', [id, item.description, item.quantity, item.price]);
        }
        await conn.execute('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [amount, accountId]);
        await conn.commit();
        res.status(201).json({ message: 'Invoice created' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
});

apiRouter.put('/invoices/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute('SELECT amount, account_id, status FROM invoices WHERE id = ?', [id]);
        if (rows.length === 0) throw new Error('Invoice not found');
        const inv = rows[0];
        if (inv.status !== 'PAID' && status === 'PAID') {
            await conn.execute('UPDATE accounts SET current_balance = GREATEST(0, current_balance - ?) WHERE id = ?', [inv.amount, inv.account_id]);
        }
        await conn.execute('UPDATE invoices SET status = ? WHERE id = ?', [status, id]);
        await conn.commit();
        res.json({ message: 'Status updated' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
});

apiRouter.post('/invoices/:id/send', async (req, res) => {
    const { id } = req.params;
    try {
        const [setRows] = await pool.execute('SELECT * FROM settings WHERE id = 1');
        const settings = setRows[0];
        const transporter = nodemailer.createTransport({
            host: settings.smtp_host, port: settings.smtp_port || 587,
            secure: settings.smtp_port === 465, auth: { user: settings.smtp_user, pass: settings.smtp_pass },
        });
        const [invRows] = await pool.execute('SELECT * FROM invoices WHERE id = ?', [id]);
        const invoice = invRows[0];
        const [itemRows] = await pool.execute('SELECT description, quantity, price FROM invoice_items WHERE invoice_id = ?', [id]);
        invoice.items = itemRows;
        const [accRows] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [invoice.account_id]);
        const account = accRows[0];
        await transporter.sendMail({
            from: settings.support_email, to: account.email,
            subject: `Invoice ${invoice.id}`, html: generateInvoiceHTML(invoice, account, settings)
        });
        await pool.execute('UPDATE invoices SET email_sent = TRUE WHERE id = ?', [id]);
        res.json({ message: 'Email sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

apiRouter.post('/settings/test-email', async (req, res) => {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, support_email } = req.body;
    try {
        const transporter = nodemailer.createTransport({
            host: smtp_host, port: smtp_port || 587, secure: smtp_port === 465,
            auth: { user: smtp_user, pass: smtp_pass }, connectionTimeout: 10000 
        });
        await transporter.verify();
        await transporter.sendMail({ from: support_email, to: support_email, subject: 'SMTP Test', text: 'Working!' });
        res.json({ message: 'Success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- TRANSACTIONS ---
apiRouter.post('/transactions', async (req, res) => {
    const { accountId, date, type, amount, description } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const id = `TX-${Date.now()}`;
        await conn.execute('INSERT INTO transactions (id, account_id, date, type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', [id, accountId, date, type, amount, description]);
        await conn.execute('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [amount, accountId]);
        await conn.commit();
        res.status(201).json({ message: 'Recorded' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
});

// --- SETTINGS ---
apiRouter.get('/settings', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM settings WHERE id = 1');
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

apiRouter.put('/settings', async (req, res) => {
    const { station_name, support_email, auto_generate, payment_terms, tax_rate, smtp_host, smtp_port, smtp_user, smtp_pass } = req.body;
    try {
        await pool.execute('UPDATE settings SET station_name = ?, support_email = ?, auto_generate = ?, payment_terms = ?, tax_rate = ?, smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ? WHERE id = 1', [station_name, support_email, auto_generate, payment_terms, tax_rate, smtp_host, smtp_port, smtp_user, smtp_pass]);
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mount Router at both root and /api to ensure connectivity regardless of client prefixing
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch-all 404 handler for debugging
app.use((req, res) => {
    console.warn(`[404] No route found for: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Not Found: ${req.url}. Check if the server is mounted correctly.` });
});

app.listen(PORT, () => {
    console.log(`FuelCharge Pro Server active on port ${PORT}`);
});
