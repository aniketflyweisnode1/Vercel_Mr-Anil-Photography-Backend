const SocialMedia = require('../models/social.media.model');
const User = require('../models/user.model');

// Create new social media
const createSocialMedia = async (req, res) => {
  try {
    const { name, url, user_id } = req.body;
    const currentUserId = req.user.user_id; // From auth middleware

    // Validate that user exists
    const existingUser = await User.findOne({ user_id: parseInt(user_id) });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    // Check if social media with same name and user already exists
    const existingSocialMedia = await SocialMedia.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      user_id: parseInt(user_id)
    });

    if (existingSocialMedia) {
      return res.status(400).json({
        success: false,
        message: 'Social media with this name already exists for this user'
      });
    }

    const socialMedia = new SocialMedia({
      name,
      url,
      user_id: parseInt(user_id),
      createdBy: currentUserId,
      updatedBy: currentUserId
    });

    await socialMedia.save();

    res.status(201).json({
      success: true,
      message: 'Social media created successfully',
      data: socialMedia
    });
  } catch (error) {
    console.error('Error creating social media:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update social media
const updateSocialMedia = async (req, res) => {
  try {
    const { social_id, name, url, status } = req.body;
    const currentUserId = req.user.user_id; // From auth middleware

    const socialMedia = await SocialMedia.findOne({ social_id: parseInt(social_id) });

    if (!socialMedia) {
      return res.status(404).json({
        success: false,
        message: 'Social media not found'
      });
    }

    // Check if updated name conflicts with existing social media for the same user
    if (name) {
      const existingSocialMedia = await SocialMedia.findOne({
        $and: [
          { social_id: { $ne: parseInt(social_id) } },
          { user_id: socialMedia.user_id },
          { name: { $regex: new RegExp(`^${name}$`, 'i') } }
        ]
      });

      if (existingSocialMedia) {
        return res.status(400).json({
          success: false,
          message: 'Social media with this name already exists for this user'
        });
      }
    }

    // Update fields
    if (name) socialMedia.name = name;
    if (url) socialMedia.url = url;
    if (status !== undefined) socialMedia.status = status;
    
    socialMedia.updatedBy = currentUserId;
    socialMedia.updatedAt = Date.now();

    await socialMedia.save();

    res.json({
      success: true,
      message: 'Social media updated successfully',
      data: socialMedia
    });
  } catch (error) {
    console.error('Error updating social media:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get social media by ID
const getSocialMediaById = async (req, res) => {
  try {
    const { social_id } = req.params;

    const socialMedia = await SocialMedia.findOne({ social_id: parseInt(social_id) });

    if (!socialMedia) {
      return res.status(404).json({
        success: false,
        message: 'Social media not found'
      });
    }

    // Populate user information manually
    const socialMediaObj = socialMedia.toObject();
    if (socialMediaObj.user_id) {
      const user = await User.findOne({ user_id: socialMediaObj.user_id });
      socialMediaObj.user = user ? {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      } : null;
    }
    if (socialMediaObj.createdBy) {
      const createdByUser = await User.findOne({ user_id: socialMediaObj.createdBy });
      socialMediaObj.createdByUser = createdByUser ? {
        user_id: createdByUser.user_id,
        name: createdByUser.name,
        email: createdByUser.email
      } : null;
    }
    if (socialMediaObj.updatedBy) {
      const updatedByUser = await User.findOne({ user_id: socialMediaObj.updatedBy });
      socialMediaObj.updatedByUser = updatedByUser ? {
        user_id: updatedByUser.user_id,
        name: updatedByUser.name,
        email: updatedByUser.email
      } : null;
    }

    res.json({
      success: true,
      data: socialMediaObj
    });
  } catch (error) {
    console.error('Error getting social media by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all social media
const getAllSocialMedia = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status !== undefined) {
      filter.status = status === 'true';
    }
    if (user_id) {
      filter.user_id = parseInt(user_id);
    }
   

    const socialMedia = await SocialMedia.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate user information manually for all social media
    const populatedSocialMedia = await Promise.all(socialMedia.map(async (item) => {
      const socialMediaObj = item.toObject();
      if (socialMediaObj.user_id) {
        const user = await User.findOne({ user_id: socialMediaObj.user_id });
        socialMediaObj.user = user ? {
          user_id: user.user_id,
          name: user.name,
          email: user.email
        } : null;
      }
      if (socialMediaObj.createdBy) {
        const createdByUser = await User.findOne({ user_id: socialMediaObj.createdBy });
        socialMediaObj.createdByUser = createdByUser ? {
          user_id: createdByUser.user_id,
          name: createdByUser.name,
          email: createdByUser.email
        } : null;
      }
      if (socialMediaObj.updatedBy) {
        const updatedByUser = await User.findOne({ user_id: socialMediaObj.updatedBy });
        socialMediaObj.updatedByUser = updatedByUser ? {
          user_id: updatedByUser.user_id,
          name: updatedByUser.name,
          email: updatedByUser.email
        } : null;
      }
      return socialMediaObj;
    }));

    const total = await SocialMedia.countDocuments(filter);

    res.json({
      success: true,
      data: populatedSocialMedia,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting all social media:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createSocialMedia,
  updateSocialMedia,
  getSocialMediaById,
  getAllSocialMedia
}; 