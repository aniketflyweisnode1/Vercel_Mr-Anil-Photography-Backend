const RefundCancelPolicy = require('../models/refund-cancel-policy.model.js');
const User = require('../models/user.model.js');

// Create a new refund-cancel-policy entry
const createRefundCancelPolicy = async (req, res) => {
  try {
    const { heading, sub_heading, description } = req.body;
    
    // Validate required fields
    if (!heading || !description) {
      return res.status(400).json({
        success: false,
        message: 'Heading and description are required'
      });
    }

    // Get user ID from authenticated user
    const createdBy = req.user.user_id;

    // Validate that user exists
    const existingUser = await User.findOne({ user_id: parseInt(createdBy) });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    // Create new refund-cancel-policy entry
    const newRefundCancelPolicy = new RefundCancelPolicy({
      heading,
      sub_heading,
      description,
      createdBy
    });

    const savedRefundCancelPolicy = await newRefundCancelPolicy.save();

    res.status(201).json({
      success: true,
      message: 'Refund & Cancel Policy entry created successfully',
      data: savedRefundCancelPolicy
    });

  } catch (error) {
    console.error('Error creating refund-cancel-policy entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all refund-cancel-policy entries
const getAllRefundCancelPolicy = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const refundCancelPolicyEntries = await RefundCancelPolicy.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await RefundCancelPolicy.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Refund & Cancel Policy entries retrieved successfully',
      data: refundCancelPolicyEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting refund-cancel-policy entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get refund-cancel-policy by ID
const getRefundCancelPolicyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Refund & Cancel Policy ID provided'
      });
    }

    // Try to find by refund_policy_id first (numeric ID)
    let refundCancelPolicy = await RefundCancelPolicy.findOne({ refund_policy_id: numericId });
    
    // If not found by refund_policy_id, try to find by MongoDB _id (ObjectId)
    if (!refundCancelPolicy) {
      try {
        refundCancelPolicy = await RefundCancelPolicy.findById(id);
      } catch (objectIdError) {
        return res.status(404).json({
          success: false,
          message: 'Refund & Cancel Policy entry not found'
        });
      }
    }

    if (!refundCancelPolicy) {
      return res.status(404).json({
        success: false,
        message: 'Refund & Cancel Policy entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Refund & Cancel Policy entry retrieved successfully',
      data: refundCancelPolicy
    });

  } catch (error) {
    console.error('Error getting refund-cancel-policy entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update refund-cancel-policy entry
const updateRefundCancelPolicy = async (req, res) => {
  try {
    const { id, heading, sub_heading, description, status } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Refund & Cancel Policy ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Refund & Cancel Policy ID provided'
      });
    }

    const refundCancelPolicy = await RefundCancelPolicy.findOne({ refund_policy_id: numericId });
    if (!refundCancelPolicy) {
      return res.status(404).json({
        success: false,
        message: 'Refund & Cancel Policy entry not found'
      });
    }

    // Get user ID from authenticated user
    const updatedBy = req.user.user_id;

    // Validate that user exists
    const existingUser = await User.findOne({ user_id: parseInt(updatedBy) });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided for updatedBy'
      });
    }

    // Update refund-cancel-policy entry
    const updatedRefundCancelPolicy = await RefundCancelPolicy.findOneAndUpdate(
      { refund_policy_id: parseInt(id) },
      {
        heading,
        sub_heading,
        description,
        status,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Refund & Cancel Policy entry updated successfully',
      data: updatedRefundCancelPolicy
    });

  } catch (error) {
    console.error('Error updating refund-cancel-policy entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createRefundCancelPolicy,
  getAllRefundCancelPolicy,
  getRefundCancelPolicyById,
  updateRefundCancelPolicy
}; 