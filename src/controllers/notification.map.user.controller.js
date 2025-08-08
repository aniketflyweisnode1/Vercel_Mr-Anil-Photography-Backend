const NotificationMapUser = require('../models/notification.map.user.model');
const User = require('../models/user.model');
const Notification = require('../models/notifications.model');

// Create new notification map user
const createNotificationMapUser = async (req, res) => {
  try {
    const { user_id, notification_id } = req.body;
    const currentUserId = req.user.user_id; // From auth middleware

    // Validate that user exists
    const existingUser = await User.findOne({ user_id: parseInt(user_id) });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    // Validate that notification exists
    const existingNotification = await Notification.findOne({ notification_id: parseInt(notification_id) });
    if (!existingNotification) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID provided'
      });
    }

    // Check if mapping already exists
    const existingMapping = await NotificationMapUser.findOne({
      user_id: parseInt(user_id),
      notification_id: parseInt(notification_id)
    });

    if (existingMapping) {
      return res.status(400).json({
        success: false,
        message: 'Notification mapping already exists for this user'
      });
    }

    const notificationMapUser = new NotificationMapUser({
      user_id: parseInt(user_id),
      notification_id: parseInt(notification_id),
      createdBy: currentUserId,
      updatedBy: currentUserId
    });

    await notificationMapUser.save();

    res.status(201).json({
      success: true,
      message: 'Notification mapping created successfully',
      data: notificationMapUser
    });
  } catch (error) {
    console.error('Error creating notification mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update notification map user
const updateNotificationMapUser = async (req, res) => {
  try {
    const { map_id, is_read, status } = req.body;
    const currentUserId = req.user.user_id; // From auth middleware

    const notificationMapUser = await NotificationMapUser.findOne({ map_id: parseInt(map_id) });

    if (!notificationMapUser) {
      return res.status(404).json({
        success: false,
        message: 'Notification mapping not found'
      });
    }

    // Update fields
    if (is_read !== undefined) notificationMapUser.is_read = is_read;
    if (status !== undefined) notificationMapUser.status = status;
    
    notificationMapUser.updatedBy = currentUserId;
    notificationMapUser.updatedAt = Date.now();

    await notificationMapUser.save();

    res.json({
      success: true,
      message: 'Notification mapping updated successfully',
      data: notificationMapUser
    });
  } catch (error) {
    console.error('Error updating notification mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get notification map user by ID
const getNotificationMapUserById = async (req, res) => {
  try {
    const { map_id } = req.params;

    const notificationMapUser = await NotificationMapUser.findOne({ map_id: parseInt(map_id) });

    if (!notificationMapUser) {
      return res.status(404).json({
        success: false,
        message: 'Notification mapping not found'
      });
    }

    // Populate user and notification information manually
    const notificationMapUserObj = notificationMapUser.toObject();
    if (notificationMapUserObj.user_id) {
      const user = await User.findOne({ user_id: notificationMapUserObj.user_id });
      notificationMapUserObj.user = user ? {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      } : null;
    }
    if (notificationMapUserObj.notification_id) {
      const notification = await Notification.findOne({ notification_id: notificationMapUserObj.notification_id });
      notificationMapUserObj.notification = notification ? {
        notification_id: notification.notification_id,
        title: notification.title,
        description: notification.description,
        notification_type: notification.notification_type
      } : null;
    }
    if (notificationMapUserObj.createdBy) {
      const createdByUser = await User.findOne({ user_id: notificationMapUserObj.createdBy });
      notificationMapUserObj.createdByUser = createdByUser ? {
        user_id: createdByUser.user_id,
        name: createdByUser.name,
        email: createdByUser.email
      } : null;
    }
    if (notificationMapUserObj.updatedBy) {
      const updatedByUser = await User.findOne({ user_id: notificationMapUserObj.updatedBy });
      notificationMapUserObj.updatedByUser = updatedByUser ? {
        user_id: updatedByUser.user_id,
        name: updatedByUser.name,
        email: updatedByUser.email
      } : null;
    }

    res.json({
      success: true,
      data: notificationMapUserObj
    });
  } catch (error) {
    console.error('Error getting notification mapping by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all notification map users
const getAllNotificationMapUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, user_id, notification_id, is_read, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (user_id) {
      filter.user_id = parseInt(user_id);
    }
    if (notification_id) {
      filter.notification_id = parseInt(notification_id);
    }
    if (is_read !== undefined) {
      filter.is_read = is_read === 'true';
    }
    if (status !== undefined) {
      filter.status = status === 'true';
    }

    const notificationMapUsers = await NotificationMapUser.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate user and notification information manually for all mappings
    const populatedNotificationMapUsers = await Promise.all(notificationMapUsers.map(async (mapping) => {
      const notificationMapUserObj = mapping.toObject();
      if (notificationMapUserObj.user_id) {
        const user = await User.findOne({ user_id: notificationMapUserObj.user_id });
        notificationMapUserObj.user = user ? {
          user_id: user.user_id,
          name: user.name,
          email: user.email
        } : null;
      }
      if (notificationMapUserObj.notification_id) {
        const notification = await Notification.findOne({ notification_id: notificationMapUserObj.notification_id });
        notificationMapUserObj.notification = notification ? {
          notification_id: notification.notification_id,
          title: notification.title,
          description: notification.description,
          notification_type: notification.notification_type
        } : null;
      }
      if (notificationMapUserObj.createdBy) {
        const createdByUser = await User.findOne({ user_id: notificationMapUserObj.createdBy });
        notificationMapUserObj.createdByUser = createdByUser ? {
          user_id: createdByUser.user_id,
          name: createdByUser.name,
          email: createdByUser.email
        } : null;
      }
      if (notificationMapUserObj.updatedBy) {
        const updatedByUser = await User.findOne({ user_id: notificationMapUserObj.updatedBy });
        notificationMapUserObj.updatedByUser = updatedByUser ? {
          user_id: updatedByUser.user_id,
          name: updatedByUser.name,
          email: updatedByUser.email
        } : null;
      }
      return notificationMapUserObj;
    }));

    const total = await NotificationMapUser.countDocuments(filter);

    res.json({
      success: true,
      data: populatedNotificationMapUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting all notification mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createNotificationMapUser,
  updateNotificationMapUser,
  getNotificationMapUserById,
  getAllNotificationMapUsers
}; 