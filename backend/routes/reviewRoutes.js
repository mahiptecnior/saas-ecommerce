const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authorizeTenantRole = require('../middleware/authorizeTenantRole');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', authorizeTenantRole('products', 'read'), reviewController.getReviews);
router.patch('/:id/status', authorizeTenantRole('products', 'write'), reviewController.updateReviewStatus);
router.delete('/:id', authorizeTenantRole('products', 'delete'), reviewController.deleteReview);

module.exports = router;
