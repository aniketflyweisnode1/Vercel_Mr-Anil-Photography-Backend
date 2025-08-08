const express = require('express');
const {
  createPayment,
  updatePayment,
  getPaymentById,
  getPaymentsByCreatedBy,
  getAllPayments
} = require('../../../controllers/payment.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new payment (protected route) 2025-08-06
router.post('/create', auth, createPayment);

// Update payment (protected route) 2025-08-06
router.put('/update', auth, updatePayment);

// Get payments by authenticated user (protected route) 2025-08-06
router.get('/my-payments', auth, getPaymentsByCreatedBy);

// Get all payments with pagination and filtering 2025-08-06
router.get('/', getAllPayments);

// Get payment by ID 2025-08-06
router.get('/:id', getPaymentById);

module.exports = router; 