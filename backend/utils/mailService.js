const nodemailer = require('nodemailer');
const pool = require('../config/db');

exports.sendEmail = async (to, subject, text, html, tenantId = null) => {
    try {
        let settings = {};

        // 1. Try fetching Tenant Settings first if tenantId provided
        if (tenantId) {
            const [tenantSettings] = await pool.query(
                'SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from FROM store_settings WHERE tenant_id = ?',
                [tenantId]
            );
            if (tenantSettings.length > 0 && tenantSettings[0].smtp_host) {
                settings = tenantSettings[0];
            }
        }

        // 2. If no tenant settings, fallback to Platform Settings
        if (!settings.smtp_host) {
            const [platformRows] = await pool.query(
                'SELECT setting_key, setting_value FROM platform_settings WHERE setting_key IN ("smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from")'
            );
            const platformSettings = platformRows.reduce((acc, current) => {
                acc[current.setting_key] = current.setting_value;
                return acc;
            }, {});
            settings = {
                smtp_host: platformSettings.smtp_host,
                smtp_port: platformSettings.smtp_port,
                smtp_user: platformSettings.smtp_user,
                smtp_pass: platformSettings.smtp_pass,
                smtp_from: platformSettings.smtp_from
            };
        }

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
exports.testSMTP = async (config) => {
    try {
        const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, test_email } = config;
        const recipient = test_email || smtp_from;

        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: parseInt(smtp_port) || 587,
            secure: smtp_port == 465,
            auth: { user: smtp_user, pass: smtp_pass },
            tls: { rejectUnauthorized: false }
        });

        // Verify connection configuration
        await transporter.verify();

        // Send a test email to the specified recipient
        const info = await transporter.sendMail({
            from: smtp_from || '"Nazmart Platform" <noreply@nazmart.com>',
            to: recipient,
            subject: '✅ SMTP Test Successful — Nazmart Platform',
            text: `Your SMTP settings are correctly configured!\n\nHost: ${smtp_host}\nPort: ${smtp_port}\nFrom: ${smtp_from}\n\nThis is a test email from your Nazmart eCommerce platform.`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
                    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #fff; margin: 0; font-size: 20px;">✅ SMTP Test Successful</h1>
                        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your email configuration is working correctly</p>
                    </div>
                    <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <table style="width: 100%; font-size: 14px; color: #475569;">
                            <tr><td style="padding: 8px 0; font-weight: 600;">Host</td><td style="padding: 8px 0;">${smtp_host}</td></tr>
                            <tr><td style="padding: 8px 0; font-weight: 600;">Port</td><td style="padding: 8px 0;">${smtp_port}</td></tr>
                            <tr><td style="padding: 8px 0; font-weight: 600;">From</td><td style="padding: 8px 0;">${smtp_from}</td></tr>
                            <tr><td style="padding: 8px 0; font-weight: 600;">Sent To</td><td style="padding: 8px 0;">${recipient}</td></tr>
                        </table>
                    </div>
                    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">Nazmart SaaS eCommerce Platform</p>
                </div>
            `
        });

        return { success: true, messageId: info.messageId, sentTo: recipient };
    } catch (error) {
        console.error('SMTP Test Error:', error);
        throw error;
    }
};
