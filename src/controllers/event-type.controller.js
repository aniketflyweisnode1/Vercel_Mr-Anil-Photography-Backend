const EventType = require('../models/event-type.model.js');
const User = require('../models/user.model.js');

// Create a new event type
const createEventType = async (req, res) => {
  try {
    const { event_type, status = true } = req.body;

    // Validate required fields
    if (!event_type) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    // Check if event type already exists
    const existingEventType = await EventType.findOne({ event_type });
    if (existingEventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type already exists'
      });
    }

    // Create new event type
    const newEventType = new EventType({
      event_type,
      status,
      createdBy: req.user.user_id,
      updatedBy: req.user.user_id
    });

    const savedEventType = await newEventType.save();

    res.status(201).json({
      success: true,
      message: 'Event type created successfully',
      data: savedEventType
    });

  } catch (error) {
    console.error('Error creating event type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update event type
const updateEventType = async (req, res) => {
  try {
 
    const { event_type, status, event_type_id } = req.body;

    // Validate required fields
    if (!event_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Event type ID is required'
      });
    }

    // Check if event type exists
    const existingEventType = await EventType.findOne({ event_type_id: parseInt(event_type_id) });
    if (!existingEventType) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    // Check if new event type name already exists (excluding current record)
    if (event_type && event_type !== existingEventType.event_type) {
      const duplicateEventType = await EventType.findOne({ 
        event_type, 
        event_type_id: { $ne: parseInt(event_type_id) }
      });
      if (duplicateEventType) {
        return res.status(400).json({
          success: false,
          message: 'Event type name already exists'
        });
      }
    }

    // Update event type
    const updatedEventType = await EventType.findOneAndUpdate(
      { event_type_id: parseInt(event_type_id) },
      {
        event_type: event_type || existingEventType.event_type,
        status: status !== undefined ? status : existingEventType.status,
        updatedBy: req.user.user_id,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Event type updated successfully',
      data: updatedEventType
    });

  } catch (error) {
    console.error('Error updating event type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get event type by ID
const getEventTypeById = async (req, res) => {
  try {
    const { event_type_id } = req.params;

    if (!event_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Event type ID is required'
      });
    }

    const eventType = await EventType.findOne({ event_type_id: parseInt(event_type_id) });

    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    // Get created by user information
    const createdByUser = await User.findOne({ user_id: eventType.createdBy });
    const updatedByUser = eventType.updatedBy ? await User.findOne({ user_id: eventType.updatedBy }) : null;

    const eventTypeWithUsers = {
      ...eventType.toObject(),
      createdByUser: createdByUser ? {
        user_id: createdByUser.user_id,
        name: createdByUser.name,
        email: createdByUser.email
      } : null,
      updatedByUser: updatedByUser ? {
        user_id: updatedByUser.user_id,
        name: updatedByUser.name,
        email: updatedByUser.email
      } : null
    };

    res.status(200).json({
      success: true,
      message: 'Event type found',
      data: eventTypeWithUsers
    });

  } catch (error) {
    console.error('Error getting event type by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all event types
const getAllEventTypes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,  
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    
    // Status filter
    if (status !== undefined) {
      query.status = status === 'true';
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const eventTypes = await EventType.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EventType.countDocuments(query);

    // Populate user information for each event type
    const eventTypesWithUsers = await Promise.all(
      eventTypes.map(async (eventType) => {
        const createdByUser = await User.findOne({ user_id: eventType.createdBy });
        const updatedByUser = eventType.updatedBy ? await User.findOne({ user_id: eventType.updatedBy }) : null;

        return {
          ...eventType.toObject(),
          createdByUser: createdByUser ? {
            user_id: createdByUser.user_id,
            name: createdByUser.name,
            email: createdByUser.email
          } : null,
          updatedByUser: updatedByUser ? {
            user_id: updatedByUser.user_id,
            name: updatedByUser.name,
            email: updatedByUser.email
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Event types retrieved successfully',
      data: eventTypesWithUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all event types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createEventType,
  updateEventType,
  getEventTypeById,
  getAllEventTypes
};
