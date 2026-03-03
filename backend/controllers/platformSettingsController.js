const pool = require('../config/db');

exports.getSettings = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM platform_settings');
        const settings = rows.reduce((acc, current) => {
            acc[current.setting_key] = current.setting_value;
            return acc;
        }, {});
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching platform settings' });
    }
};

exports.updateSettings = async (req, res) => {
    const settings = req.body;
    try {
        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                `INSERT INTO platform_settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [key, value, value]
            );
        }
        res.json({ success: true, message: 'Platform settings updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating platform settings' });
    }
};

const mailService = require('../utils/mailService');
exports.testSmtp = async (req, res) => {
    const { email } = req.body;
    try {
        const info = await mailService.sendEmail(email, "SMTP Configuration Test", "This is a test email.", "<p>This is a test email to verify your platform SMTP configuration.</p>");
        if (info) {
            res.json({ success: true, message: 'Test email sent successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send test email. Check server logs.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error testing SMTP' });
    }
};
const multer = require('multer');
const path = require('path');

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'platform-logo-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

exports.uploadLogo = [
    upload.single('logo'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Save relative path to DB
        const logoUrl = `/uploads/${req.file.filename}`;

        try {
            await pool.query(
                `INSERT INTO platform_settings (setting_key, setting_value) 
                 VALUES ('platform_logo', ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [logoUrl, logoUrl]
            );
            res.json({ success: true, message: 'Logo uploaded successfully', url: logoUrl });
        } catch (error) {
            console.error('Error saving logo to DB:', error);
            res.status(500).json({ success: false, message: 'Error saving logo configuration' });
        }
    }
];
