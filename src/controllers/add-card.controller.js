const AddCard = require('../models/add-card.model.js');
const User = require('../models/user.model.js');
const { 
  createErrorActivity 
} = require('../utils/activity-feed.utils.js');

// Create a new card
const createCard = async (req, res) => {
  try {
    const {
      holder_name,
      card_no,
      expire_date,
      cvc_no,
      status
    } = req.body;

    // Validate required fields
    if (!holder_name || !card_no || !expire_date || !cvc_no) {
      return res.status(400).json({
        success: false,
        message: 'Card holder name, card number, expiry date, and CVC are required'
      });
    }

    // Check if card already exists for this user
    const existingCard = await AddCard.findOne({
      card_no: card_no,
      createdBy: req.user.user_id
    });

    if (existingCard) {
      return res.status(409).json({
        success: false,
        message: 'Card already exists for this user'
      });
    }

    // Create new card
    const newCard = new AddCard({
      holder_name,
      card_no,
      expire_date,
      cvc_no,
      status: status !== undefined ? status : true,
      createdBy: req.user.user_id,
      updatedBy: req.user.user_id
    });

    const savedCard = await newCard.save();

    // Get user information
    const user = await User.findOne({ user_id: req.user.user_id });

    const cardObj = savedCard.toObject();
    if (user) {
      cardObj.user = {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      };
    }

    res.status(201).json({
      success: true,
      message: 'Card added successfully',
      data: cardObj
    });

  } catch (error) {
    console.error('Error creating card:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'Card Creation',
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

// Update card
const updateCard = async (req, res) => {
  try {
    const { card_id, ...updateData } = req.body;

    // Validate that card_id is provided
    if (!card_id) {
      return res.status(400).json({
        success: false,
        message: 'Card ID is required in request body'
      });
    }

    // Check if card exists
    const existingCard = await AddCard.findOne({ card_id: parseInt(card_id) });
    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Check if user has permission to update this card
    if (existingCard.createdBy !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this card'
      });
    }

    // Update the card
    const updatedCard = await AddCard.findOneAndUpdate(
      { card_id: parseInt(card_id) },
      {
        ...updateData,
        updatedBy: req.user.user_id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Get user information
    const user = await User.findOne({ user_id: updatedCard.createdBy });
    const cardObj = updatedCard.toObject();
    if (user) {
      cardObj.user = {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      };
    }

    res.status(200).json({
      success: true,
      message: 'Card updated successfully',
      data: cardObj
    });

  } catch (error) {
    console.error('Error updating card:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'Card Update',
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

// Get card by ID
const getCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await AddCard.findOne({ card_id: parseInt(id) });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Check if user has permission to view this card
    if (card.createdBy !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this card'
      });
    }

    // Get user information
    const user = await User.findOne({ user_id: card.createdBy });
    const cardObj = card.toObject();
    if (user) {
      cardObj.user = {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      };
    }

    res.status(200).json({
      success: true,
      data: cardObj
    });

  } catch (error) {
    console.error('Error getting card by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all cards (admin only)
const getAllCards = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);


    const cards = await AddCard.find({createdBy:req.user.user_id})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));



    res.status(200).json({
      success: true,
      data: cards,
     
    });

  } catch (error) {
    console.error('Error getting all cards:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get cards by authenticated user
const getCardsByAuth = async (req, res) => {
  try {
    console.log("req.user.user_id",req.user.user_id);
  
    const cards = await AddCard.find({createdBy:req.user.user_id})
    res.status(200).json({
      success: true,
      data: cards,
     
    });

  } catch (error) {
    console.error('Error getting cards by auth:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createCard,
  updateCard,
  getCardById,
  getAllCards,
  getCardsByAuth
};
