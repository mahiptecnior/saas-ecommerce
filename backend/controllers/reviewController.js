const pool = require('../config/db');

exports.getReviews = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT r.*, p.name as product_name 
            FROM product_reviews r
            JOIN products p ON r.product_id = p.id
            WHERE r.tenant_id = ?
            ORDER BY r.created_at DESC
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching reviews", error);
        res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
};

exports.updateReviewStatus = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        await pool.query(
            'UPDATE product_reviews SET status = ? WHERE id = ? AND tenant_id = ?',
            [status, id, tenantId]
        );
        res.json({ success: true, message: `Review ${status}` });
    } catch (error) {
        console.error("Error updating review", error);
        res.status(500).json({ success: false, message: 'Error updating review' });
    }
};

exports.deleteReview = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM product_reviews WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error("Error deleting review", error);
        res.status(500).json({ success: false, message: 'Error deleting review' });
    }
};
