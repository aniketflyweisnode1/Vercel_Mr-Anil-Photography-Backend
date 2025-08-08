const PlansPricing = require('../models/plans-pricing.model.js');
const User = require('../models/user.model.js');

// Create a new plans-pricing entry
const createPlansPricing = async (req, res) => {
  try {
    const { 
      type, 
      pricing_month, 
      pricing_year, 
      pricing_offer, 
      plan_name, 
      credit, 
      qr_sharing, 
      qr_sharing_text,
      sharing_via_link, 
      sharing_via_link_text,
      edit_song, 
      edit_song_text,
      required_to_view, 
      required_to_view_text,
      social_media, 
      social_media_text,
      arrange_sheets, 
      arrange_sheets_text,
      chat_clients, 
      chat_clients_text,
      views_monetization,
      views_monetization_text
    } = req.body;
    
    // Validate required fields
    if (!type || !pricing_month || !pricing_year || !plan_name) {
      return res.status(400).json({
        success: false,
        message: 'Type, pricing_month, pricing_year, and plan_name are required'
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

    // Create new plans-pricing entry
    const newPlansPricing = new PlansPricing({
      type,
      pricing_month,
      pricing_year,
      pricing_offer,
      plan_name,
      credit,
      qr_sharing,
      qr_sharing_text,
      sharing_via_link,
      sharing_via_link_text,
      edit_song,
      edit_song_text,
      required_to_view,
      required_to_view_text,
      social_media,
      social_media_text,
      arrange_sheets,
      arrange_sheets_text,
      chat_clients,
      chat_clients_text,
      views_monetization,
      views_monetization_text,
      createdBy
    });

    const savedPlansPricing = await newPlansPricing.save();

    res.status(201).json({
      success: true,
      message: 'Plans & Pricing entry created successfully',
      data: savedPlansPricing
    });

  } catch (error) {
    console.error('Error creating plans-pricing entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all plans-pricing entries
const getAllPlansPricing = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }
    if (type) {
      query.type = type;
    }

    const plansPricingEntries = await PlansPricing.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await PlansPricing.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Plans & Pricing entries retrieved successfully',
      data: plansPricingEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting plans-pricing entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get plans-pricing by ID
const getPlansPricingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Plans & Pricing ID provided'
      });
    }

    // Try to find by plans_id first (numeric ID)
    let plansPricing = await PlansPricing.findOne({ plans_id: numericId });
    
    // If not found by plans_id, try to find by MongoDB _id (ObjectId)
    if (!plansPricing) {
      try {
        plansPricing = await PlansPricing.findById(id);
      } catch (objectIdError) {
        return res.status(404).json({
          success: false,
          message: 'Plans & Pricing entry not found'
        });
      }
    }

    if (!plansPricing) {
      return res.status(404).json({
        success: false,
        message: 'Plans & Pricing entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Plans & Pricing entry retrieved successfully',
      data: plansPricing
    });

  } catch (error) {
    console.error('Error getting plans-pricing entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update plans-pricing entry
const updatePlansPricing = async (req, res) => {
  try {
    const { 
      id, 
      type, 
      pricing_month, 
      pricing_year, 
      pricing_offer, 
      plan_name, 
      credit, 
      qr_sharing, 
      qr_sharing_text,
      sharing_via_link, 
      sharing_via_link_text,
      edit_song, 
      edit_song_text,
      required_to_view, 
      required_to_view_text,
      social_media, 
      social_media_text,
      arrange_sheets, 
      arrange_sheets_text,
      chat_clients, 
      chat_clients_text,
      views_monetization,
      views_monetization_text,
      status
    } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Plans & Pricing ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Plans & Pricing ID provided'
      });
    }

    const plansPricing = await PlansPricing.findOne({ plans_id: numericId });
    if (!plansPricing) {
      return res.status(404).json({
        success: false,
        message: 'Plans & Pricing entry not found'
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

    // Update plans-pricing entry
    const updatedPlansPricing = await PlansPricing.findOneAndUpdate(
      { plans_id: parseInt(id) },
      {
        type,
        pricing_month,
        pricing_year,
        pricing_offer,
        plan_name,
        credit,
        qr_sharing,
        qr_sharing_text,
        sharing_via_link,
        sharing_via_link_text,
        edit_song,
        edit_song_text,
        required_to_view,
        required_to_view_text,
        social_media,
        social_media_text,
        arrange_sheets,
        arrange_sheets_text,
        chat_clients,
        chat_clients_text,
        views_monetization,
        views_monetization_text,
        status,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Plans & Pricing entry updated successfully',
      data: updatedPlansPricing
    });

  } catch (error) {
    console.error('Error updating plans-pricing entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createPlansPricing,
  getAllPlansPricing,
  getPlansPricingById,
  updatePlansPricing
}; 