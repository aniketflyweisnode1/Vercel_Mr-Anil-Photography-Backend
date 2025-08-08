const HyperGuidelines = require('../models/hyper-guidelines.model.js');
const User = require('../models/user.model.js');

// Create a new hyper-guidelines entry
const createHyperGuidelines = async (req, res) => {
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

    // Create new hyper-guidelines entry
    const newHyperGuidelines = new HyperGuidelines({
      heading,
      sub_heading,
      description,
      createdBy
    });

    const savedHyperGuidelines = await newHyperGuidelines.save();

    res.status(201).json({
      success: true,
      message: 'Hyper Guidelines entry created successfully',
      data: savedHyperGuidelines
    });

  } catch (error) {
    console.error('Error creating hyper-guidelines entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all hyper-guidelines entries
const getAllHyperGuidelines = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const hyperGuidelinesEntries = await HyperGuidelines.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await HyperGuidelines.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Hyper Guidelines entries retrieved successfully',
      data: hyperGuidelinesEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting hyper-guidelines entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get hyper-guidelines by ID
const getHyperGuidelinesById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Hyper Guidelines ID provided'
      });
    }

    // Try to find by hyper_id first (numeric ID)
    let hyperGuidelines = await HyperGuidelines.findOne({ hyper_id: numericId });
    
    // If not found by hyper_id, try to find by MongoDB _id (ObjectId)
    if (!hyperGuidelines) {
      try {
        hyperGuidelines = await HyperGuidelines.findById(id);
      } catch (objectIdError) {
        return res.status(404).json({
          success: false,
          message: 'Hyper Guidelines entry not found'
        });
      }
    }

    if (!hyperGuidelines) {
      return res.status(404).json({
        success: false,
        message: 'Hyper Guidelines entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hyper Guidelines entry retrieved successfully',
      data: hyperGuidelines
    });

  } catch (error) {
    console.error('Error getting hyper-guidelines entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update hyper-guidelines entry
const updateHyperGuidelines = async (req, res) => {
  try {
    const { id, heading, sub_heading, description, status } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Hyper Guidelines ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Hyper Guidelines ID provided'
      });
    }

    const hyperGuidelines = await HyperGuidelines.findOne({ hyper_id: numericId });
    if (!hyperGuidelines) {
      return res.status(404).json({
        success: false,
        message: 'Hyper Guidelines entry not found'
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

    // Update hyper-guidelines entry
    const updatedHyperGuidelines = await HyperGuidelines.findOneAndUpdate(
      { hyper_id: parseInt(id) },
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
      message: 'Hyper Guidelines entry updated successfully',
      data: updatedHyperGuidelines
    });

  } catch (error) {
    console.error('Error updating hyper-guidelines entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createHyperGuidelines,
  getAllHyperGuidelines,
  getHyperGuidelinesById,
  updateHyperGuidelines
}; 