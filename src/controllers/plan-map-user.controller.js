const PlanMapUser = require('../models/plan-map-user.model.js');
const User = require('../models/user.model.js');
const PlansPricing = require('../models/plans-pricing.model.js');
const Payment = require('../models/payment.model.js');
const { 
  createPlanActivatedActivity, 
  createPlanExpiredActivity,
  createErrorActivity 
} = require('../utils/activity-feed.utils.js');

// Helper function to calculate expired_plan
const calculateExpiredPlan = (paymentdate, planmap_month_year) => {
  if (!paymentdate) return 0;
  
  const paymentDate = new Date(paymentdate);
  const currentDate = new Date();
  const planDuration = parseInt(planmap_month_year);
  
  // Calculate expiry date
  const expiryDate = new Date(paymentDate);
  expiryDate.setDate(expiryDate.getDate() + planDuration);
  
  // Calculate remaining days
  const remainingDays = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, remainingDays);
};

// Create a new plan map user
const createPlanMapUser = async (req, res) => {
  try {
    const {
      user_id,
      plan_id,
      planmap_month_year,
      paymentstatus,
      payment_id
    } = req.body;

    // Validate required fields
    if (!user_id || !plan_id || !planmap_month_year) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Plan ID, and plan map month year are required'
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
    const plan = await PlansPricing.findOne({ plans_id: parseInt(plan_id) });
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if payment exists (if provided)
    let payment = null;
    if (payment_id) {
      payment = await Payment.findOne({ payment_id: parseInt(payment_id) });
      if (!payment) {
        return res.status(400).json({
          success: false,
          message: 'Payment not found'
        });
      }
    }

    // Calculate expired_plan if payment is completed
    let expired_plan = 0;
    if (payment && payment.status === 'completed' && payment.paymentdate) {
      expired_plan = calculateExpiredPlan(payment.paymentdate, planmap_month_year);
    }

    // Create new plan map user
    const newPlanMap = new PlanMapUser({
      user_id: parseInt(user_id),
      plan_id: parseInt(plan_id),
      planmap_month_year,
      paymentstatus,
      payment_id: payment_id ? parseInt(payment_id) : null,
      expired_plan,
      created_by: req.user.user_id,
      updated_by: req.user.user_id
    });

    const savedPlanMap = await newPlanMap.save();

    // Create activity feed entry for plan activation
    if (savedPlanMap.paymentstatus === 'completed') {
      await createPlanActivatedActivity(
        req.user.user_id,
        plan ? plan.plan_name : 'Premium Plan',
        savedPlanMap.planmap_month_year,
        req.user.user_id
      );
    }

    // Populate user and plan information
    const planMapObj = savedPlanMap.toObject();
    planMapObj.user = {
      user_id: user.user_id,
      name: user.name,
      studio_name: user.studio_name,
      email: user.email
    };
    planMapObj.plan = {
      plan_id: plan.plan_id,
      plan_name: plan.plan_name,
      plan_price: plan.plan_price
    };
    if (payment) {
      planMapObj.payment = {
        payment_id: payment.payment_id,
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method
      };
    }

    res.status(201).json({
      success: true,
      message: 'Plan map user created successfully',
      data: planMapObj
    });

  } catch (error) {
    console.error('Error creating plan map user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update plan map user
const updatePlanMapUser = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Plan Map ID is required in request body'
      });
    }

    // Check if plan map exists
    const existingPlanMap = await PlanMapUser.findOne({ planMap_id: parseInt(id) });
    if (!existingPlanMap) {
      return res.status(404).json({
        success: false,
        message: 'Plan map user not found'
      });
    }

    // Check if user has permission to update this plan map
    if (existingPlanMap.created_by !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this plan map'
      });
    }

    // Calculate expired_plan if payment status is being updated to completed
    if (updateData.paymentstatus === 'completed' && existingPlanMap.paymentstatus !== 'completed') {
      const payment = await Payment.findOne({ payment_id: existingPlanMap.payment_id });
      if (payment && payment.paymentdate) {
        updateData.expired_plan = calculateExpiredPlan(payment.paymentdate, existingPlanMap.planmap_month_year);
      }
    }

    // Update the plan map
    const updatedPlanMap = await PlanMapUser.findOneAndUpdate(
      { planMap_id: parseInt(id) },
      {
        ...updateData,
        updated_by: req.user.user_id,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Populate user and plan information
    const user = await User.findOne({ user_id: updatedPlanMap.user_id });
    const plan = await PlansPricing.findOne({ plan_id: updatedPlanMap.plan_id });
    const payment = updatedPlanMap.payment_id ? await Payment.findOne({ payment_id: updatedPlanMap.payment_id }) : null;
    const planMapObj = updatedPlanMap.toObject();
    
    if (user) {
      planMapObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email
      };
    }
    
    if (plan) {
      planMapObj.plan = {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        plan_price: plan.plan_price
      };
    }

    if (payment) {
      planMapObj.payment = {
        payment_id: payment.payment_id,
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method
      };
    }

    res.status(200).json({
      success: true,
      message: 'Plan map user updated successfully',
      data: planMapObj
    });

  } catch (error) {
    console.error('Error updating plan map user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get plan map user by ID (check status true)
const getPlanMapUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const planMap = await PlanMapUser.findOne({ planMap_id: parseInt(id), status: true });
    if (!planMap) {
      return res.status(404).json({
        success: false,
        message: 'Plan map user not found or inactive'
      });
    }

    // Populate user and plan information
    const user = await User.findOne({ user_id: planMap.user_id });
    const plan = await PlansPricing.findOne({ plan_id: planMap.plan_id });
    const payment = planMap.payment_id ? await Payment.findOne({ payment_id: planMap.payment_id }) : null;
    const planMapObj = planMap.toObject();
    
    if (user) {
      planMapObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email
      };
    }
    
    if (plan) {
      planMapObj.plan = {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        plan_price: plan.plan_price
      };
    }

    if (payment) {
      planMapObj.payment = {
        payment_id: payment.payment_id,
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method
      };
    }

    res.status(200).json({
      success: true,
      data: planMapObj
    });

  } catch (error) {
    console.error('Error getting plan map user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get plan map users by created-by (with auth)
const getPlanMapUsersByCreatedBy = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentstatus
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { created_by: req.user.user_id };

   

    // Add status filter
    if (status !== undefined) {
      query.status = status === 'true';
    }

    // Add payment status filter
    if (paymentstatus) {
      query.paymentstatus = paymentstatus;
    }

    const planMaps = await PlanMapUser.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PlanMapUser.countDocuments(query);

    // Populate user and plan information for each plan map
    const planMapsWithDetails = await Promise.all(
      planMaps.map(async (planMap) => {
        const user = await User.findOne({ user_id: planMap.user_id });
        const plan = await PlansPricing.findOne({ plan_id: planMap.plan_id });
        const payment = planMap.payment_id ? await Payment.findOne({ payment_id: planMap.payment_id }) : null;
        const planMapObj = planMap.toObject();
        
        if (user) {
          planMapObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email
          };
        }
        
        if (plan) {
          planMapObj.plan = {
            plan_id: plan.plan_id,
            plan_name: plan.plan_name,
            plan_price: plan.plan_price
          };
        }

        if (payment) {
          planMapObj.payment = {
            payment_id: payment.payment_id,
            amount: payment.amount,
            status: payment.status,
            payment_method: payment.payment_method
          };
        }
        
        return planMapObj;
      })
    );

    res.status(200).json({
      success: true,
      data: planMapsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting plan map users by created by:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all plan map users (check status true)
const getAllPlanMapUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      plan_id,
      paymentstatus
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { status: true };

    // Add other filters
    if (user_id) query.user_id = parseInt(user_id);
    if (plan_id) query.plan_id = parseInt(plan_id);
    if (paymentstatus) query.paymentstatus = paymentstatus;

    const planMaps = await PlanMapUser.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PlanMapUser.countDocuments(query);

    // Populate user and plan information for each plan map
    const planMapsWithDetails = await Promise.all(
      planMaps.map(async (planMap) => {
        const user = await User.findOne({ user_id: planMap.user_id });
        const plan = await PlansPricing.findOne({ plan_id: planMap.plan_id });
        const payment = planMap.payment_id ? await Payment.findOne({ payment_id: planMap.payment_id }) : null;
        const planMapObj = planMap.toObject();
        
        if (user) {
          planMapObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email
          };
        }
        
        if (plan) {
          planMapObj.plan = {
            plan_id: plan.plan_id,
            plan_name: plan.plan_name,
            plan_price: plan.plan_price
          };
        }

        if (payment) {
          planMapObj.payment = {
            payment_id: payment.payment_id,
            amount: payment.amount,
            status: payment.status,
            payment_method: payment.payment_method
          };
        }
        
        return planMapObj;
      })
    );

    res.status(200).json({
      success: true,
      data: planMapsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all plan map users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createPlanMapUser,
  updatePlanMapUser,
  getPlanMapUserById,
  getPlanMapUsersByCreatedBy,
  getAllPlanMapUsers
}; 