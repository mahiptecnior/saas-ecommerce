const pool = require('../config/db');

exports.getAccounts = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM accounts WHERE tenant_id = ? ORDER BY code ASC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching accounts' });
    }
};

exports.createAccount = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, code, type, parent_id } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO accounts (tenant_id, name, code, type, parent_id) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, code, type, parent_id || null]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name, code, type } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating account' });
    }
};

exports.getJournals = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT j.*, 
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('account_id', account_id, 'debit', debit, 'credit', credit))
                    FROM journal_entries WHERE journal_id = j.id) as entries
            FROM journals j 
            WHERE tenant_id = ? 
            ORDER BY date DESC`, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching journals' });
    }
};

exports.createJournal = async (req, res) => {
    const tenantId = req.tenantId;
    const { description, reference, date, entries } = req.body; // entries: [{account_id, debit, credit}]

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [journalResult] = await connection.query(
            'INSERT INTO journals (tenant_id, description, reference, date) VALUES (?, ?, ?, ?)',
            [tenantId, description, reference, date]
        );
        const journalId = journalResult.insertId;

        for (const entry of entries) {
            await connection.query(
                'INSERT INTO journal_entries (tenant_id, journal_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)',
                [tenantId, journalId, entry.account_id, entry.debit || 0, entry.credit || 0]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, data: { journalId } });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Error creating journal entry' });
    } finally {
        connection.release();
    }
};

exports.getLedger = async (req, res) => {
    const tenantId = req.tenantId;
    const { accountId } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT je.*, j.date, j.description, j.reference
            FROM journal_entries je
            JOIN journals j ON je.journal_id = j.id
            WHERE je.account_id = ? AND je.tenant_id = ?
            ORDER BY j.date ASC`, [accountId, tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching ledger' });
    }
};

exports.getBalanceSheet = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT a.type, a.name, a.code, 
                   SUM(je.debit) as total_debit, 
                   SUM(je.credit) as total_credit
            FROM accounts a
            LEFT JOIN journal_entries je ON a.id = je.account_id
            WHERE a.tenant_id = ? AND a.type IN ('asset', 'liability', 'equity')
            GROUP BY a.id, a.type, a.name, a.code
            ORDER BY a.type, a.code ASC`, [tenantId]);

        const balanceSheet = {
            assets: rows.filter(r => r.type === 'asset'),
            liabilities: rows.filter(r => r.type === 'liability'),
            equity: rows.filter(r => r.type === 'equity')
        };

        res.json({ success: true, data: balanceSheet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error generating balance sheet' });
    }
};
