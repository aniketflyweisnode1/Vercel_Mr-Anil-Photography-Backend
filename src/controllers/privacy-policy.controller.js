const PrivacyPolicy = require('../models/privacy-policy.model.js');
const User = require('../models/user.model.js');

// Create a new privacy-policy entry
const createPrivacyPolicy = async (req, res) => {
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

    // Create new privacy-policy entry
    const newPrivacyPolicy = new PrivacyPolicy({
      heading,
      sub_heading,
      description,
      createdBy
    });

    const savedPrivacyPolicy = await newPrivacyPolicy.save();

    res.status(201).json({
      success: true,
      message: 'Privacy Policy entry created successfully',
      data: savedPrivacyPolicy
    });

  } catch (error) {
    console.error('Error creating privacy-policy entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all privacy-policy entries
const getAllPrivacyPolicy = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const privacyPolicyEntries = await PrivacyPolicy.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await PrivacyPolicy.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Privacy Policy entries retrieved successfully',
      data: privacyPolicyEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting privacy-policy entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get privacy-policy by ID
const getPrivacyPolicyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Privacy Policy ID provided'
      });
    }

    // Try to find by privacy_policy_id first (numeric ID)
    let privacyPolicy = await PrivacyPolicy.findOne({ privacy_policy_id: numericId });
    
    // If not found by privacy_policy_id, try to find by MongoDB _id (ObjectId)
    if (!privacyPolicy) {
      try {
        privacyPolicy = await PrivacyPolicy.findById(id);
      } catch (objectIdError) {
        return res.status(404).json({
          success: false,
          message: 'Privacy Policy entry not found'
        });
      }
    }

    if (!privacyPolicy) {
      return res.status(404).json({
        success: false,
        message: 'Privacy Policy entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Privacy Policy entry retrieved successfully',
      data: privacyPolicy
    });

  } catch (error) {
    console.error('Error getting privacy-policy entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update privacy-policy entry
const updatePrivacyPolicy = async (req, res) => {
  try {
    const { id, heading, sub_heading, description, status } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Privacy Policy ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Privacy Policy ID provided'
      });
    }

    const privacyPolicy = await PrivacyPolicy.findOne({ privacy_policy_id: numericId });
    if (!privacyPolicy) {
      return res.status(404).json({
        success: false,
        message: 'Privacy Policy entry not found'
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

    // Update privacy-policy entry
    const updatedPrivacyPolicy = await PrivacyPolicy.findOneAndUpdate(
      { privacy_policy_id: parseInt(id) },
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
      message: 'Privacy Policy entry updated successfully',
      data: updatedPrivacyPolicy
    });

  } catch (error) {
    console.error('Error updating privacy-policy entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createPrivacyPolicy,
  getAllPrivacyPolicy,
  getPrivacyPolicyById,
  updatePrivacyPolicy
}; 