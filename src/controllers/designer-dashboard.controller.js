const Albums = require('../models/albums.model.js');
const AlbumShare = require('../models/album-share.model.js');
const DesignerMapPhotographers = require('../models/designer-map-photographers.model.js');
const PlanMapUser = require('../models/plan-map-user.model.js');
const ActivityFeed = require('../models/activity-feed.model.js');
const User = require('../models/user.model.js');

// Get designer dashboard data
const getDesignerDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get total albums count (created and shared)
    const ownAlbumsCount = await Albums.countDocuments({ photographer_id: userId, status: true });
    const sharedAlbumsCount = await AlbumShare.countDocuments({ user_id: userId, status: true });
    const totalAlbumsCount = ownAlbumsCount + sharedAlbumsCount;

    // Get total photographers count (from designer-map-photographers)
    const totalPhotographersCount = await DesignerMapPhotographers.countDocuments({ 
      createdBy: userId, 
      status: true 
    });

    // Get total credits from active plan-map-user
    const activePlanMap = await PlanMapUser.findOne({ 
      user_id: userId, 
      status: true,
      paymentstatus: 'completed'
    });

    let totalCredits = 0;
    let planCreditsReminder = null;

    if (activePlanMap) {
      totalCredits = activePlanMap.expired_plan || 0;
      
      // Calculate plan credits reminder (days until expiry)
      if (activePlanMap.expired_plan > 0) {
        planCreditsReminder = {
          daysRemaining: activePlanMap.expired_plan,
          isExpired: activePlanMap.expired_plan <= 0,
          planDetails: {
            planMap_id: activePlanMap.planMap_id,
            planmap_month_year: activePlanMap.planmap_month_year,
            paymentstatus: activePlanMap.paymentstatus
          }
        };
      }
    }

    // Get activity feed (latest 10 entries)
    const activityFeed = await ActivityFeed.find({ 
      user_id: userId, 
      status: true 
    })
    .sort({ created_at: -1 })
    .limit(10);

    // Manually populate user information for each activity
    const activityFeedWithUser = await Promise.all(
      activityFeed.map(async (activity) => {
        const user = await User.findOne({ user_id: activity.user_id });
        return {
          activity_id: activity.activity_id,
          emoji: activity.emoji,
          activity: activity.activity,
          created_at: activity.created_at,
          user: user ? {
            user_id: user.user_id,
            name: user.name,
            email: user.email
          } : null
        };
      })
    );

    // Dashboard response
    const dashboardData = {
      totalAlbums: {
        count: totalAlbumsCount,
        breakdown: {
          ownAlbums: ownAlbumsCount,
          sharedAlbums: sharedAlbumsCount
        }
      },
      totalPhotographers: {
        count: totalPhotographersCount
      },
      totalCredits: {
        count: totalCredits,
        hasActivePlan: !!activePlanMap
      },
      planCreditsReminder: planCreditsReminder,
      activityFeed: {
        count: activityFeed.length,
        entries: activityFeedWithUser
      }
    };

    res.status(200).json({
      success: true,
      message: 'Designer dashboard data retrieved successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('Error getting designer dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getDesignerDashboard
}; 