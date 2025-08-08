const ContactMessage = require('../models/contact-message.model.js');
const User = require('../models/user.model.js');

// Create a new contact-message entry
const createContactMessage = async (req, res) => {
  try {
    const { name, contact_no, description } = req.body;
    
    // Validate required fields
    if (!name || !contact_no || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, contact_no, and description are required'
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

    // Create new contact-message entry
    const newContactMessage = new ContactMessage({
      name,
      contact_no,
      description,
      createdBy
    });

    const savedContactMessage = await newContactMessage.save();

    res.status(201).json({
      success: true,
      message: 'Contact Message entry created successfully',
      data: savedContactMessage
    });

  } catch (error) {
    console.error('Error creating contact-message entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create a new contact-message entry
const createContactMessageWithoutAuth = async (req, res) => {
  try {
    const { name, contact_no, description } = req.body;
    
    // Validate required fields
    if (!name || !contact_no || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, contact_no, and description are required'
      });
    }

    // Get user ID from authenticated user
    const createdBy = 1;

    // Validate that user exists
    const existingUser = await User.findOne({ user_id: parseInt(createdBy) });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    // Create new contact-message entry
    const newContactMessage = new ContactMessage({
      name,
      contact_no,
      description,
      createdBy
    });

    const savedContactMessage = await newContactMessage.save();

    res.status(201).json({
      success: true,
      message: 'Contact Message entry created successfully',
      data: savedContactMessage
    });

  } catch (error) {
    console.error('Error creating contact-message entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Get all contact-message entries
const getAllContactMessage = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const contactMessageEntries = await ContactMessage.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await ContactMessage.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Contact Message entries retrieved successfully',
      data: contactMessageEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting contact-message entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get contact-message by ID
const getContactMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Contact Message ID provided'
      });
    }

    // Try to find by message_id first (numeric ID)
    let contactMessage = await ContactMessage.findOne({ message_id: numericId });
    
    // If not found by message_id, try to find by MongoDB _id (ObjectId)
    if (!contactMessage) {
      try {
        contactMessage = await ContactMessage.findById(id);
      } catch (objectIdError) {
        return res.status(404).json({
          success: false,
          message: 'Contact Message entry not found'
        });
      }
    }

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Contact Message entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact Message entry retrieved successfully',
      data: contactMessage
    });

  } catch (error) {
    console.error('Error getting contact-message entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update contact-message entry
const updateContactMessage = async (req, res) => {
  try {
    const { id, name, contact_no, description, reply, reply_by, status } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Contact Message ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Contact Message ID provided'
      });
    }

    const contactMessage = await ContactMessage.findOne({ message_id: numericId });
    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Contact Message entry not found'
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

    // Validate that user exists if reply_by is provided
    if (reply_by) {
      const existingUser = await User.findOne({ user_id: parseInt(reply_by) });
      if (!existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID provided for reply_by'
        });
      }
    }

    // Update contact-message entry
    const updatedContactMessage = await ContactMessage.findOneAndUpdate(
      { message_id: parseInt(id) },
      {
        name,
        contact_no,
        description,
        reply,
        reply_by,
        status,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Contact Message entry updated successfully',
      data: updatedContactMessage
    });

  } catch (error) {
    console.error('Error updating contact-message entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createContactMessage,
  getAllContactMessage,
  getContactMessageById,
  updateContactMessage,
  createContactMessageWithoutAuth
}; 