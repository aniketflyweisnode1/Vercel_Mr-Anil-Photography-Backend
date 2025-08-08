const Payment = require('../models/payment.model.js');
const User = require('../models/user.model.js');
const PlansPricing = require('../models/plans-pricing.model.js');
const { 
  createPaymentCompletedActivity, 
  createPaymentFailedActivity,
  createErrorActivity 
} = require('../utils/activity-feed.utils.js');

// Create a new payment
const createPayment = async (req, res) => {
  try {
    const {
      user_id,
      planId,
      amount,
      payment_method,
      reference_number
    } = req.body;

    // Validate required fields
    if (!user_id || !planId || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Plan ID, amount, and payment method are required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ user_id: user_id });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if plan exists
    const plan = await PlansPricing.findOne({ plans_id: planId });
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Set payment status to completed and payment date
    const paymentStatus = 'completed';
    const paymentdate = new Date();
    const referenceNumber = reference_number || `REF-${Date.now()}`;

    // Create new payment
    const newPayment = new Payment({
      user_id: user_id,
      planId: planId,
      amount,
      status: paymentStatus,
      payment_method,
      paymentdate,
      reference_number: referenceNumber,
      created_by: req.user.user_id,
      updated_by: req.user.user_id
    });

    const savedPayment = await newPayment.save();

    // Create activity feed entry for payment completion
    await createPaymentCompletedActivity(
      req.user.user_id,
      savedPayment.amount,
      plan.plan_name || 'Premium Plan',
      req.user.user_id
    );

    // Populate user and plan information
    const paymentObj = savedPayment.toObject();
    paymentObj.user = {
      user_id: user.user_id,
      name: user.name,
      studio_name: user.studio_name,
      email: user.email
    };
    paymentObj.plan = {
      plan_id: plan.plan_id,
      plan_name: plan.plan_name,
      plan_price: plan.plan_price
    };

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: paymentObj
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'Payment Creation',
        error.message,
        req.user.user_id
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required in request body'
      });
    }

    // Check if payment exists
    const existingPayment = await Payment.findOne({ payment_id: parseInt(id) });
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user has permission to update this payment
    if (existingPayment.created_by !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this payment'
      });
    }

    // Set payment date and reference number if status is being updated to completed
    if (updateData.status === 'completed' && existingPayment.status !== 'completed') {
      updateData.paymentdate = new Date();
      if (!updateData.reference_number) {
        updateData.reference_number = `REF-${Date.now()}`;
      }
    }

    // Update the payment
    const updatedPayment = await Payment.findOneAndUpdate(
      { payment_id: parseInt(id) },
      {
        ...updateData,
        updated_by: req.user.user_id,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Create activity feed entries based on status changes
    if (updateData.status === 'completed' && existingPayment.status !== 'completed') {
      const plan = await PlansPricing.findOne({ plan_id: updatedPayment.planId });
      await createPaymentCompletedActivity(
        req.user.user_id,
        updatedPayment.amount,
        plan ? plan.plan_name : 'Premium Plan',
        req.user.user_id
      );
    } else if (updateData.status === 'failed' && existingPayment.status !== 'failed') {
      const plan = await PlansPricing.findOne({ plan_id: updatedPayment.planId });
      await createPaymentFailedActivity(
        req.user.user_id,
        updatedPayment.amount,
        plan ? plan.plan_name : 'Premium Plan',
        req.user.user_id
      );
    }

    // Populate user and plan information
    const user = await User.findOne({ user_id: updatedPayment.user_id });
    const plan = await PlansPricing.findOne({ plan_id: updatedPayment.planId });
    const paymentObj = updatedPayment.toObject();
    
    if (user) {
      paymentObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email
      };
    }
    
    if (plan) {
      paymentObj.plan = {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        plan_price: plan.plan_price
      };
    }

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: paymentObj
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'Payment Update',
        error.message,
        req.user.user_id
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get payment by ID (check status true)
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOne({ payment_id: parseInt(id), status: { $ne: 'failed' } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or failed'
      });
    }

    // Populate user and plan information
    const user = await User.findOne({ user_id: payment.user_id });
    const plan = await PlansPricing.findOne({ plan_id: payment.planId });
    const paymentObj = payment.toObject();
    
    if (user) {
      paymentObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email
      };
    }
    
    if (plan) {
      paymentObj.plan = {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        plan_price: plan.plan_price
      };
    }

    res.status(200).json({
      success: true,
      data: paymentObj
    });

  } catch (error) {
    console.error('Error getting payment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get payments by created-by (with auth)
const getPaymentsByCreatedBy = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { created_by: req.user.user_id };

    // Add status filter
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    // Populate user and plan information for each payment
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const user = await User.findOne({ user_id: payment.user_id });
        const plan = await PlansPricing.findOne({ plan_id: payment.planId });
        const paymentObj = payment.toObject();
        
        if (user) {
          paymentObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email
          };
        }
        
        if (plan) {
          paymentObj.plan = {
            plan_id: plan.plan_id,
            plan_name: plan.plan_name,
            plan_price: plan.plan_price
          };
        }
        
        return paymentObj;
      })
    );

    res.status(200).json({
      success: true,
      data: paymentsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting payments by created by:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all payments (check status true)
const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      planId,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { status: { $ne: 'failed' } };

    // Add other filters
    if (user_id) query.user_id = parseInt(user_id);
    if (planId) query.planId = parseInt(planId);
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    // Populate user and plan information for each payment
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const user = await User.findOne({ user_id: payment.user_id });
        const plan = await PlansPricing.findOne({ plan_id: payment.planId });
        const paymentObj = payment.toObject();
        
        if (user) {
          paymentObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email
          };
        }
        
        if (plan) {
          paymentObj.plan = {
            plan_id: plan.plan_id,
            plan_name: plan.plan_name,
            plan_price: plan.plan_price
          };
        }
        
        return paymentObj;
      })
    );

    res.status(200).json({
      success: true,
      data: paymentsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all payments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createPayment,
  updatePayment,
  getPaymentById,
  getPaymentsByCreatedBy,
  getAllPayments
}; 