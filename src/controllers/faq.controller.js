const FAQ = require('../models/faq.model.js');
const User = require('../models/user.model.js');
const { 
  createGenericActivity,
  createErrorActivity 
} = require('../utils/activity-feed.utils.js');

// Create a new FAQ entry
const createFAQ = async (req, res) => {
  try {
    const { question, answer, description } = req.body;
    
    // Validate required fields
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
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

    // Create new FAQ entry
    const newFAQ = new FAQ({
      question,
      answer,
      description,
      createdBy
    });

    const savedFAQ = await newFAQ.save();

    // Create activity feed entry for FAQ creation
    await createGenericActivity(
      req.user.user_id,
      'FAQ Entry Created',
      `FAQ: "${savedFAQ.question.substring(0, 50)}${savedFAQ.question.length > 50 ? '...' : ''}"`,
      '❓',
      req.user.user_id
    );

    res.status(201).json({
      success: true,
      message: 'FAQ entry created successfully',
      data: savedFAQ
    });

  } catch (error) {
    console.error('Error creating FAQ entry:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'FAQ Creation',
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

// Get all FAQ entries
const getAllFAQ = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const faqEntries = await FAQ.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await FAQ.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'FAQ entries retrieved successfully',
      data: faqEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting FAQ entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get FAQ by ID
const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID provided'
      });
    }

    // Try to find by faq_id first (numeric ID)
    let faq = await FAQ.findOne({ faq_id: numericId });
    
    // If not found by faq_id, try to find by MongoDB _id (ObjectId)
    if (!faq) {
      try {
        faq = await FAQ.findById(id);
      } catch (objectIdError) {
        return res.status(404).json({
          success: false,
          message: 'FAQ entry not found'
        });
      }
    }

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ entry retrieved successfully',
      data: faq
    });

  } catch (error) {
    console.error('Error getting FAQ entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update FAQ entry
const updateFAQ = async (req, res) => {
  try {
    const { id, question, answer, description, status } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'FAQ ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID provided'
      });
    }

    const faq = await FAQ.findOne({ faq_id: numericId });
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ entry not found'
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

    // Update FAQ entry
    const updatedFAQ = await FAQ.findOneAndUpdate(
      { faq_id: parseInt(id) },
      {
        question,
        answer,
        description,
        status,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    // Create activity feed entry for FAQ update
    await createGenericActivity(
      req.user.user_id,
      'FAQ Entry Updated',
      `FAQ: "${updatedFAQ.question.substring(0, 50)}${updatedFAQ.question.length > 50 ? '...' : ''}"`,
      '✏️',
      req.user.user_id
    );

    res.status(200).json({
      success: true,
      message: 'FAQ entry updated successfully',
      data: updatedFAQ
    });

  } catch (error) {
    console.error('Error updating FAQ entry:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'FAQ Update',
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

module.exports = {
  createFAQ,
  getAllFAQ,
  getFAQById,
  updateFAQ
}; 