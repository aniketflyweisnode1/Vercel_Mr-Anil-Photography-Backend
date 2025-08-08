const DesignerMapPhotographers = require('../models/designer-map-photographers.model.js');
const User = require('../models/user.model.js');
const { 
  createPhotographerMappedActivity
} = require('../utils/activity-feed.utils.js');

// Create a new designer map photographer
const createDesignerMapPhotographer = async (req, res) => {
  try {
    const {
      user_id,
      description,
      status
    } = req.body;

    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ user_id: parseInt(user_id) });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if mapping already exists for this user
    const existingMapping = await DesignerMapPhotographers.findOne({
      user_id: parseInt(user_id)
    });

    if (existingMapping) {
      return res.status(409).json({
        success: false,
        message: 'Designer mapping already exists for this user'
      });
    }

    // Create new designer map photographer
    const newDesignerMap = new DesignerMapPhotographers({
      user_id: parseInt(user_id),
      description,
      status,
      createdBy: req.user.user_id,
      updatedBy: req.user.user_id
    });

    const savedDesignerMap = await newDesignerMap.save();

    // Create activity feed entry for photographer mapping
    await createPhotographerMappedActivity(
      req.user.user_id,
      user.name,
      req.user.user_id
    );

    // Populate user information
    const designerMapObj = savedDesignerMap.toObject();
    designerMapObj.user = {
      user_id: user.user_id,
      name: user.name,
      studio_name: user.studio_name,
      email: user.email,
      mobile: user.mobile
    };

    res.status(201).json({
      success: true,
      message: 'Designer mapping created successfully',
      data: designerMapObj
    });

  } catch (error) {
    console.error('Error creating designer mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update designer map photographer
const updateDesignerMapPhotographer = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Designer Map ID is required in request body'
      });
    }

    // Check if designer mapping exists
    const existingMapping = await DesignerMapPhotographers.findOne({ photographerMap_id: parseInt(id) });
    if (!existingMapping) {
      return res.status(404).json({
        success: false,
        message: 'Designer mapping not found'
      });
    }

    // Check if user has permission to update this mapping
    if (existingMapping.createdBy !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this designer mapping'
      });
    }

    // Update the designer mapping
    const updatedMapping = await DesignerMapPhotographers.findOneAndUpdate(
      { photographerMap_id: parseInt(id) },
      {
        ...updateData,
        updatedBy: req.user.user_id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Populate user information
    const user = await User.findOne({ user_id: updatedMapping.user_id });
    const designerMapObj = updatedMapping.toObject();
    
    if (user) {
      designerMapObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email,
        mobile: user.mobile
      };
    }

    res.status(200).json({
      success: true,
      message: 'Designer mapping updated successfully',
      data: designerMapObj
    });

  } catch (error) {
    console.error('Error updating designer mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get designer map photographer by ID (check status true)
const getDesignerMapPhotographerById = async (req, res) => {
  try {
    const { id } = req.params;

    const designerMap = await DesignerMapPhotographers.findOne({ photographerMap_id: parseInt(id), status: true });
    if (!designerMap) {
      return res.status(404).json({
        success: false,
        message: 'Designer mapping not found or inactive'
      });
    }

    // Populate user information
    const user = await User.findOne({ user_id: designerMap.user_id });
    const designerMapObj = designerMap.toObject();
    
    if (user) {
      designerMapObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email,
        mobile: user.mobile,
        country: user.country,
        state: user.state,
        city: user.city
      };
    }

    res.status(200).json({
      success: true,
      data: designerMapObj
    });

  } catch (error) {
    console.error('Error getting designer mapping by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get designer mappings by created-by (with auth)
const getDesignerMappingsByCreatedBy = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { createdBy: req.user.user_id };

    
    // Add status filter
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const designerMappings = await DesignerMapPhotographers.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DesignerMapPhotographers.countDocuments(query);

    // Populate user information for each mapping
    const mappingsWithUser = await Promise.all(
      designerMappings.map(async (mapping) => {
        const user = await User.findOne({ user_id: mapping.user_id });
        const mappingObj = mapping.toObject();
        
        if (user) {
          mappingObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email,
            mobile: user.mobile,
            country: user.country,
            state: user.state,
            city: user.city
          };
        }
        
        return mappingObj;
      })
    );

    res.status(200).json({
      success: true,
      data: mappingsWithUser,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting designer mappings by created by:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all designer mappings (check status true)
const getAllDesignerMappings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      createdBy
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { status: true };

    // Add other filters
    if (user_id) query.user_id = parseInt(user_id);
    if (createdBy) query.createdBy = parseInt(createdBy);

    const designerMappings = await DesignerMapPhotographers.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DesignerMapPhotographers.countDocuments(query);

    // Populate user information for each mapping
    const mappingsWithUser = await Promise.all(
      designerMappings.map(async (mapping) => {
        const user = await User.findOne({ user_id: mapping.user_id });
        const mappingObj = mapping.toObject();
        
        if (user) {
          mappingObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email,
            mobile: user.mobile,
            country: user.country,
            state: user.state,
            city: user.city
          };
        }
        
        return mappingObj;
      })
    );

    res.status(200).json({
      success: true,
      data: mappingsWithUser,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all designer mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createDesignerMapPhotographer,
  updateDesignerMapPhotographer,
  getDesignerMapPhotographerById,
  getDesignerMappingsByCreatedBy,
  getAllDesignerMappings
}; 