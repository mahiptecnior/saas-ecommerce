const pool = require('../config/db');

exports.getActivePlans = async (req, res) => {
    try {
        // Fetch all plans and order them by monthly price
        const [plans] = await pool.query('SELECT * FROM plans ORDER BY price_monthly ASC');

        // Fetch all assigned modules for these plans
        const [modules] = await pool.query(`
            SELECT pm.plan_id, m.id, m.name, m.description 
            FROM plan_modules pm
            JOIN modules m ON pm.module_id = m.id
        `);

        // Format the response to group modules within each plan
        const formattedPlans = plans.map(plan => {
            return {
                ...plan,
                modules: modules.filter(m => m.plan_id === plan.id).map(m => m.name) // Return module names for easy UI rendering
            };
        });

        res.json({ success: true, data: formattedPlans });
    } catch (error) {
        console.error('Error fetching public plans:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving plans' });
    }
};
