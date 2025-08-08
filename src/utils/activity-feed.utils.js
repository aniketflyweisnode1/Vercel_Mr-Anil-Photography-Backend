const ActivityFeed = require('../models/activity-feed.model.js');

// Helper function to create activity feed entry
const createActivityEntry = async (user_id, emoji, activity, updated_by = null) => {
  try {
    const newActivityFeed = new ActivityFeed({
      user_id: parseInt(user_id),
      emoji,
      activity,
      updated_by: updated_by || parseInt(user_id)
    });

    await newActivityFeed.save();
    return newActivityFeed;
  } catch (error) {
    console.error('Error creating activity feed entry:', error);
    return null;
  }
};

// Activity feed templates for different actions
const activityTemplates = {
  // Album activities
  albumViewed: (albumName, viewCount, daysAgo) => 
    `album '${albumName}' Viewed ${viewCount} times - ${daysAgo} days ago`,
  
  albumPasswordSet: (albumName, userName, daysAgo) => 
    `Password set on album '${albumName}' by '${userName}' - ${daysAgo} days ago`,
  
  albumShared: (userName, daysAgo, time) => 
    `album '${userName}' was shared via shaplink & QR ${daysAgo} at ${time}`,
  
  // User activities
  userUpdated: (userName, updatedBy, daysAgo) => 
    `Photographer's name updated: by '${updatedBy}' - ${daysAgo} days ago`,
  
  // Generic activities
  generic: (action, details, daysAgo) => 
    `${action} ${details} - ${daysAgo} days ago`
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffTime = Math.abs(now - new Date(date));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  return `${diffDays} days ago`;
};

// Helper function to format time
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Specific activity creation functions
const createAlbumViewActivity = async (user_id, albumName, viewCount, updated_by = null) => {
  const emoji = '👁️';
  const activity = activityTemplates.albumViewed(albumName, viewCount, getTimeAgo(new Date()));
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumPasswordActivity = async (user_id, albumName, userName, updated_by = null) => {
  const emoji = '🔒';
  const activity = activityTemplates.albumPasswordSet(albumName, userName, getTimeAgo(new Date()));
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumShareActivity = async (user_id, userName, updated_by = null) => {
  const emoji = '📤';
  const activity = activityTemplates.albumShared(userName, 'Yesterday', formatTime(new Date()));
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createUserUpdateActivity = async (user_id, userName, updatedBy, updated_by = null) => {
  const emoji = '👤';
  const activity = activityTemplates.userUpdated(userName, updatedBy, getTimeAgo(new Date()));
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createGenericActivity = async (user_id, action, details, emoji = '📝', updated_by = null) => {
  const activity = activityTemplates.generic(action, details, getTimeAgo(new Date()));
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// Album Management Activities
const createAlbumCreatedActivity = async (user_id, albumName, updated_by = null) => {
  const emoji = '📸';
  const activity = `album '${albumName}' created - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumUpdatedActivity = async (user_id, albumName, updated_by = null) => {
  const emoji = '✏️';
  const activity = `album '${albumName}' updated - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumDeletedActivity = async (user_id, albumName, updated_by = null) => {
  const emoji = '🗑️';
  const activity = `album '${albumName}' deleted - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumImageUploadedActivity = async (user_id, albumName, imageCount, updated_by = null) => {
  const emoji = '🖼️';
  const activity = `${imageCount} images uploaded to album '${albumName}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumSongUploadedActivity = async (user_id, albumName, songCount, updated_by = null) => {
  const emoji = '🎵';
  const activity = `${songCount} songs uploaded to album '${albumName}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// User Management Activities
const createUserCreatedActivity = async (user_id, userName, updated_by = null) => {
  const emoji = '👤';
  const activity = `User '${userName}' registered - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createUserLoginActivity = async (user_id, userName, updated_by = null) => {
  const emoji = '🔑';
  const activity = `User '${userName}' logged in - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createUserProfileUpdatedActivity = async (user_id, userName, updated_by = null) => {
  const emoji = '📝';
  const activity = `Profile updated for '${userName}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// Payment & Plan Activities
const createPaymentCompletedActivity = async (user_id, amount, planName, updated_by = null) => {
  const emoji = '💳';
  const activity = `Payment of ₹${amount} completed for '${planName}' plan - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createPaymentFailedActivity = async (user_id, amount, planName, updated_by = null) => {
  const emoji = '❌';
  const activity = `Payment of ₹${amount} failed for '${planName}' plan - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createPlanActivatedActivity = async (user_id, planName, duration, updated_by = null) => {
  const emoji = '✅';
  const activity = `'${planName}' plan activated for ${duration} days - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createPlanExpiredActivity = async (user_id, planName, updated_by = null) => {
  const emoji = '⏰';
  const activity = `'${planName}' plan expired - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// Designer & Photographer Activities
const createPhotographerMappedActivity = async (user_id, photographerName, updated_by = null) => {
  const emoji = '🤝';
  const activity = `Photographer '${photographerName}' mapped to designer - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createPhotographerUnmappedActivity = async (user_id, photographerName, updated_by = null) => {
  const emoji = '🚫';
  const activity = `Photographer '${photographerName}' unmapped from designer - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// Album Sharing Activities
const createAlbumSharedWithUserActivity = async (user_id, albumName, sharedWithUser, updated_by = null) => {
  const emoji = '📤';
  const activity = `album '${albumName}' shared with '${sharedWithUser}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumShareRevokedActivity = async (user_id, albumName, revokedFromUser, updated_by = null) => {
  const emoji = '🚫';
  const activity = `album '${albumName}' share revoked from '${revokedFromUser}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// QR Code & Link Activities
const createQRCodeGeneratedActivity = async (user_id, albumName, updated_by = null) => {
  const emoji = '📱';
  const activity = `QR Code generated for album '${albumName}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createShaplinkGeneratedActivity = async (user_id, albumName, shaplink, updated_by = null) => {
  const emoji = '🔗';
  const activity = `Shaplink '${shaplink}' generated for album '${albumName}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// Download & Access Activities
const createAlbumDownloadedActivity = async (user_id, albumName, updated_by = null) => {
  const emoji = '⬇️';
  const activity = `album '${albumName}' downloaded - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumAccessGrantedActivity = async (user_id, albumName, updated_by = null) => {
  const emoji = '🔓';
  const activity = `Access granted to album '${albumName}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createAlbumAccessRevokedActivity = async (user_id, albumName, updated_by = null) => {
  const emoji = '🔒';
  const activity = `Access revoked from album '${albumName}' - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// System & Notification Activities
const createNotificationSentActivity = async (user_id, notificationType, updated_by = null) => {
  const emoji = '🔔';
  const activity = `${notificationType} notification sent - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createSystemMaintenanceActivity = async (user_id, maintenanceType, updated_by = null) => {
  const emoji = '🔧';
  const activity = `System ${maintenanceType} completed - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

// Error & Warning Activities
const createErrorActivity = async (user_id, errorType, errorMessage, updated_by = null) => {
  const emoji = '⚠️';
  const activity = `${errorType} error: ${errorMessage} - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

const createWarningActivity = async (user_id, warningType, warningMessage, updated_by = null) => {
  const emoji = '⚠️';
  const activity = `${warningType} warning: ${warningMessage} - ${getTimeAgo(new Date())}`;
  return await createActivityEntry(user_id, emoji, activity, updated_by);
};

module.exports = {
  createActivityEntry,
  createAlbumViewActivity,
  createAlbumPasswordActivity,
  createAlbumShareActivity,
  createUserUpdateActivity,
  createGenericActivity,
  
  // Album Management Activities
  createAlbumCreatedActivity,
  createAlbumUpdatedActivity,
  createAlbumDeletedActivity,
  createAlbumImageUploadedActivity,
  createAlbumSongUploadedActivity,
  
  // User Management Activities
  createUserCreatedActivity,
  createUserLoginActivity,
  createUserProfileUpdatedActivity,
  
  // Payment & Plan Activities
  createPaymentCompletedActivity,
  createPaymentFailedActivity,
  createPlanActivatedActivity,
  createPlanExpiredActivity,
  
  // Designer & Photographer Activities
  createPhotographerMappedActivity,
  createPhotographerUnmappedActivity,
  
  // Album Sharing Activities
  createAlbumSharedWithUserActivity,
  createAlbumShareRevokedActivity,
  
  // QR Code & Link Activities
  createQRCodeGeneratedActivity,
  createShaplinkGeneratedActivity,
  
  // Download & Access Activities
  createAlbumDownloadedActivity,
  createAlbumAccessGrantedActivity,
  createAlbumAccessRevokedActivity,
  
  // System & Notification Activities
  createNotificationSentActivity,
  createSystemMaintenanceActivity,
  
  // Error & Warning Activities
  createErrorActivity,
  createWarningActivity,
  
  // Utility Functions
  activityTemplates,
  getTimeAgo,
  formatTime
}; 