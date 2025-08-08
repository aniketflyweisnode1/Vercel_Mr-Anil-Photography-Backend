const AboutUs = require('../models/about-us.model.js');
const User = require('../models/user.model.js');

// Create a new about-us entry
const createAboutUs = async (req, res) => {
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

    // Create new about-us entry
    const newAboutUs = new AboutUs({
      heading,
      sub_heading,
      description,
      createdBy
    });

    const savedAboutUs = await newAboutUs.save();

    res.status(201).json({
      success: true,
      message: 'About-us entry created successfully',
      data: savedAboutUs
    });

  } catch (error) {
    console.error('Error creating about-us entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all about-us entries
const getAllAboutUs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const aboutUsEntries = await AboutUs.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await AboutUs.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'About-us entries retrieved successfully',
      data: aboutUsEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting about-us entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get about-us by ID
const getAboutUsById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid About-us ID provided'
      });
    }

    // Try to find by about_id first (numeric ID)
    let aboutUs = await AboutUs.findOne({ about_id: numericId });
    
    // If not found by about_id, try to find by MongoDB _id (ObjectId)
    if (!aboutUs) {
      try {
        aboutUs = await AboutUs.findById(id);
      } catch (objectIdError) {
        return res.status(404).json({
          success: false,
          message: 'About-us entry not found'
        });
      }
    }

    if (!aboutUs) {
      return res.status(404).json({
        success: false,
        message: 'About-us entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'About-us entry retrieved successfully',
      data: aboutUs
    });

  } catch (error) {
    console.error('Error getting about-us entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update about-us entry
const updateAboutUs = async (req, res) => {
  try {
    const { id, heading, sub_heading, description, status } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'About-us ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid About-us ID provided'
      });
    }

    const aboutUs = await AboutUs.findOne({ about_id: numericId });
    if (!aboutUs) {
      return res.status(404).json({
        success: false,
        message: 'About-us entry not found'
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

    // Update about-us entry
    const updatedAboutUs = await AboutUs.findOneAndUpdate(
      { about_id: parseInt(id) },
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
      message: 'About-us entry updated successfully',
      data: updatedAboutUs
    });

  } catch (error) {
    console.error('Error updating about-us entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createAboutUs,
  getAllAboutUs,
  getAboutUsById,
  updateAboutUs
}; 