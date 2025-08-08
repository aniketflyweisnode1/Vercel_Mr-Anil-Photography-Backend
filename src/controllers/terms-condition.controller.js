const TermsCondition = require('../models/terms-condition.model.js');
const User = require('../models/user.model.js');

// Create a new terms-condition entry
const createTermsCondition = async (req, res) => {
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

    // Create new terms-condition entry
    const newTermsCondition = new TermsCondition({
      heading,
      sub_heading,
      description,
      createdBy
    });

    const savedTermsCondition = await newTermsCondition.save();

    res.status(201).json({
      success: true,
      message: 'Terms & Condition entry created successfully',
      data: savedTermsCondition
    });

  } catch (error) {
    console.error('Error creating terms-condition entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all terms-condition entries
const getAllTermsCondition = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const termsConditionEntries = await TermsCondition.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await TermsCondition.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Terms & Condition entries retrieved successfully',
      data: termsConditionEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting terms-condition entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get terms-condition by ID
const getTermsConditionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Terms & Condition ID provided'
      });
    }

    // Try to find by terms_id first (numeric ID)
    let termsCondition = await TermsCondition.findOne({ terms_id: numericId });
    
    // If not found by terms_id, try to find by MongoDB _id (ObjectId)
    if (!termsCondition) {
      try {
        termsCondition = await TermsCondition.findById(id);
      } catch (objectIdError) {
        return res.status(404).json({
          success: false,
          message: 'Terms & Condition entry not found'
        });
      }
    }

    if (!termsCondition) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Condition entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Terms & Condition entry retrieved successfully',
      data: termsCondition
    });

  } catch (error) {
    console.error('Error getting terms-condition entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update terms-condition entry
const updateTermsCondition = async (req, res) => {
  try {
    const { id, heading, sub_heading, description, status } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Terms & Condition ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Terms & Condition ID provided'
      });
    }

    const termsCondition = await TermsCondition.findOne({ terms_id: numericId });
    if (!termsCondition) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Condition entry not found'
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

    // Update terms-condition entry
    const updatedTermsCondition = await TermsCondition.findOneAndUpdate(
      { terms_id: parseInt(id) },
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
      message: 'Terms & Condition entry updated successfully',
      data: updatedTermsCondition
    });

  } catch (error) {
    console.error('Error updating terms-condition entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createTermsCondition,
  getAllTermsCondition,
  getTermsConditionById,
  updateTermsCondition
}; 