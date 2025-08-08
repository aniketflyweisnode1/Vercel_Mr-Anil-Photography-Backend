const ActivityFeed = require('../models/activity-feed.model.js');
const User = require('../models/user.model.js');


// Get activity feed by ID (with auth)
const getActivityFeedById = async (req, res) => {
  try {
    const { id } = req.params;

    const activityFeed = await ActivityFeed.findOne({ activity_id: parseInt(id) });
    if (!activityFeed) {
      return res.status(404).json({
        success: false,
        message: 'Activity feed entry not found'
      });
    }

    // Populate user information
    const user = await User.findOne({ user_id: activityFeed.user_id });
    const activityObj = activityFeed.toObject();
    
    if (user) {
      activityObj.user = {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      };
    }

    res.status(200).json({
      success: true,
      data: activityObj
    });

  } catch (error) {
    console.error('Error getting activity feed by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all activity feed entries (with auth, ordered by DESC)
const getAllActivityFeed = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { status: true };

   

    // Add other filters
    if (user_id) query.user_id = parseInt(user_id);
    if (status !== undefined) query.status = status === 'true';

    const activityFeeds = await ActivityFeed.find(query)
      .sort({ created_at: -1 }) // Order by DESC
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ActivityFeed.countDocuments(query);

    // Populate user information for each activity feed
    const activityFeedsWithUser = await Promise.all(
      activityFeeds.map(async (activityFeed) => {
        const user = await User.findOne({ user_id: activityFeed.user_id });
        const activityObj = activityFeed.toObject();
        
        if (user) {
          activityObj.user = {
            user_id: user.user_id,
            name: user.name,
            email: user.email
          };
        }
        
        return activityObj;
      })
    );

    res.status(200).json({
      success: true,
      data: activityFeedsWithUser,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all activity feeds:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getActivityFeedById,
  getAllActivityFeed
}; 