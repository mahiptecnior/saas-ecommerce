const nodemailer = require('nodemailer');
const pool = require('../config/db');

exports.sendEmail = async (to, subject, text, html) => {
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM platform_settings WHERE setting_key IN ("smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from")');
        const settings = rows.reduce((acc, current) => {
            acc[current.setting_key] = current.setting_value;
            return acc;
        }, {});

        const host = settings.smtp_host || process.env.SMTP_HOST || 'smtp.mailtrap.io';
        const port = settings.smtp_port || process.env.SMTP_PORT || 2525;
        const user = settings.smtp_user || process.env.SMTP_USER;
        const pass = settings.smtp_pass || process.env.SMTP_PASS;
        const from = settings.smtp_from || process.env.SMTP_FROM || '"Nazmart Platform" <noreply@nazmart.com>';

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port == 465,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });

        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text,
            html
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Email Error:', error);
        return null;
    }
};
