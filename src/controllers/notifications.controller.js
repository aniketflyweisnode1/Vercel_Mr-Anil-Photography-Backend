const Notification = require('../models/notifications.model');
const User = require('../models/user.model');

// Create new notification
const createNotification = async (req, res) => {
  try {
    const { title, notification_type, description } = req.body;
    const currentUserId = req.user.user_id; // From auth middleware

    const notification = new Notification({
      title,
      notification_type,
      description,
      createdBy: currentUserId,
      updatedBy: currentUserId
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update notification
const updateNotification = async (req, res) => {
  try {
    const { notification_id, title, notification_type, description, status } = req.body;
    const currentUserId = req.user.user_id; // From auth middleware

    const notification = await Notification.findOne({ notification_id: parseInt(notification_id) });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update fields
    if (title) notification.title = title;
    if (notification_type) notification.notification_type = notification_type;
    if (description) notification.description = description;
    if (status !== undefined) notification.status = status;
    
    notification.updatedBy = currentUserId;
    notification.updatedAt = Date.now();

    await notification.save();

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get notification by ID
const getNotificationById = async (req, res) => {
  try {
    const { notification_id } = req.params;

    const notification = await Notification.findOne({ notification_id: parseInt(notification_id) });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Populate user information manually
    const notificationObj = notification.toObject();
    if (notificationObj.createdBy) {
      const createdByUser = await User.findOne({ user_id: notificationObj.createdBy });
      notificationObj.createdByUser = createdByUser ? {
        user_id: createdByUser.user_id,
        name: createdByUser.name,
        email: createdByUser.email
      } : null;
    }
    if (notificationObj.updatedBy) {
      const updatedByUser = await User.findOne({ user_id: notificationObj.updatedBy });
      notificationObj.updatedByUser = updatedByUser ? {
        user_id: updatedByUser.user_id,
        name: updatedByUser.name,
        email: updatedByUser.email
      } : null;
    }

    res.json({
      success: true,
      data: notificationObj
    });
  } catch (error) {
    console.error('Error getting notification by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all notifications
const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, notification_type } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status !== undefined) {
      filter.status = status === 'true';
    }
    if (notification_type) {
      filter.notification_type = notification_type;
    }
   

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate user information manually for all notifications
    const populatedNotifications = await Promise.all(notifications.map(async (notification) => {
      const notificationObj = notification.toObject();
      if (notificationObj.createdBy) {
        const createdByUser = await User.findOne({ user_id: notificationObj.createdBy });
        notificationObj.createdByUser = createdByUser ? {
          user_id: createdByUser.user_id,
          name: createdByUser.name,
          email: createdByUser.email
        } : null;
      }
      if (notificationObj.updatedBy) {
        const updatedByUser = await User.findOne({ user_id: notificationObj.updatedBy });
        notificationObj.updatedByUser = updatedByUser ? {
          user_id: updatedByUser.user_id,
          name: updatedByUser.name,
          email: updatedByUser.email
        } : null;
      }
      return notificationObj;
    }));

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: populatedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createNotification,
  updateNotification,
  getNotificationById,
  getAllNotifications
}; 