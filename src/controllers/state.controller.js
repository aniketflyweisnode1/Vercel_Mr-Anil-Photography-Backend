const State = require('../models/state.model.js');
const Country = require('../models/country.model.js');

// Create a new state
const createState = async (req, res) => {
  try {
    const { name, code, country, createdBy, updatedBy } = req.body;
    
    // Validate required fields
    if (!name || !code || !country) {
      return res.status(400).json({
        success: false,
        message: 'State name, code, and country are required'
      });
    }

    // Validate that country exists
    const existingCountry = await Country.findOne({ country_id: parseInt(country) });
    if (!existingCountry) {
      return res.status(400).json({
        success: false,
        message: 'Invalid country ID provided'
      });
    }

    // Check if state already exists with name or code
    const existingStateByName = await State.findOne({ name });
    if (existingStateByName) {
      return res.status(409).json({
        success: false,
        message: 'State with this name already exists'
      });
    }

    const existingStateByCode = await State.findOne({ code });
    if (existingStateByCode) {
      return res.status(409).json({
        success: false,
        message: 'State with this code already exists'
      });
    }

    // Create new state
    const newState = new State({
      name,
      code,
      country,
      createdBy,
      updatedBy
    });

    const savedState = await newState.save();

    res.status(201).json({
      success: true,
      message: 'State created successfully',
      data: {
        id: savedState._id,
        state_id: savedState.state_id,
        name: savedState.name,
        code: savedState.code,
        country: savedState.country,
        status: savedState.status,
        createdBy: savedState.createdBy,
        updatedBy: savedState.updatedBy,
        createdAt: savedState.createdAt,
        updatedAt: savedState.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating state:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all states
const getAllStates = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const states = await State.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Populate country information manually for all states
    const populatedStates = await Promise.all(states.map(async (state) => {
      const stateObj = state.toObject();
      if (stateObj.country) {
        const country = await Country.findOne({ country_id: stateObj.country });
        stateObj.countryInfo = country ? {
          country_id: country.country_id,
          name: country.name,
          nameCode: country.nameCode
        } : null;
      }
      return stateObj;
    }));

    const total = await State.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'States retrieved successfully',
      data: populatedStates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting states:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get state by ID
const getStateById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid State ID provided'
      });
    }

    // Try to find by state_id first (numeric ID)
    let state = await State.findOne({ state_id: numericId });
    
    // If not found by state_id, try to find by MongoDB _id (ObjectId)
    if (!state) {
      try {
        state = await State.findById(id);
      } catch (objectIdError) {
        // If ObjectId parsing fails, return not found
        return res.status(404).json({
          success: false,
          message: 'State not found'
        });
      }
    }

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    // Populate country information manually
    const stateObj = state.toObject();
    if (stateObj.country) {
      const country = await Country.findOne({ country_id: stateObj.country });
      stateObj.countryInfo = country ? {
        country_id: country.country_id,
        name: country.name,
        nameCode: country.nameCode
      } : null;
    }

    res.status(200).json({
      success: true,
      message: 'State retrieved successfully',
      data: stateObj
    });

  } catch (error) {
    console.error('Error getting state:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Get states by country
const getStateByCountry = async (req, res) => {
  try {
    const { country_id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    // Validate country_id
    if (!country_id) {
      return res.status(400).json({
        success: false,
        message: 'Country ID is required'
      });
    }

    // Validate that country exists
    const existingCountry = await Country.findOne({ country_id: parseInt(country_id) });
    if (!existingCountry) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    const query = { country: parseInt(country_id) };
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const states = await State.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    // Populate country information manually for all states
    const populatedStates = await Promise.all(states.map(async (state) => {
      const stateObj = state.toObject();
      if (stateObj.country) {
        const country = await Country.findOne({ country_id: stateObj.country });
        stateObj.countryInfo = country ? {
          country_id: country.country_id,
          name: country.name,
          nameCode: country.nameCode
        } : null;
      }
      return stateObj;
    }));

    const total = await State.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'States retrieved successfully',
      data: populatedStates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting states by country:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update state
const updateState = async (req, res) => {
  try {
    const { id, name, code, country, status, updatedBy } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'State ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid State ID provided'
      });
    }

    // Try to find by state_id first (numeric ID)
    let state = await State.findOne({ state_id: numericId });
    
    // If not found by state_id, try to find by MongoDB _id (ObjectId)
    if (!state) {
      try {
        state = await State.findById(id);
      } catch (objectIdError) {
        // If ObjectId parsing fails, return not found
        return res.status(404).json({
          success: false,
          message: 'State not found'
        });
      }
    }

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    // Check if name is being updated and if it already exists
    if (name && name !== state.name) {
      const existingState = await State.findOne({ name, _id: { $ne: state._id } });
      if (existingState) {
        return res.status(409).json({
          success: false,
          message: 'State with this name already exists'
        });
      }
    }

    // Check if code is being updated and if it already exists
    if (code && code !== state.code) {
      const existingState = await State.findOne({ code, _id: { $ne: state._id } });
      if (existingState) {
        return res.status(409).json({
          success: false,
          message: 'State with this code already exists'
        });
      }
    }

    // Validate that country exists if being updated
    if (country) {
      const existingCountry = await Country.findOne({ country_id: parseInt(country) });
      if (!existingCountry) {
        return res.status(400).json({
          success: false,
          message: 'Invalid country ID provided'
        });
      }
    }

    // Update state using the correct ID
    const updatedState = await State.findByIdAndUpdate(
      state._id,
      {
        name,
        code,
        country,
        status,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    // Populate country information manually
    const stateObj = updatedState.toObject();
    if (stateObj.country) {
      const country = await Country.findOne({ country_id: stateObj.country });
      stateObj.countryInfo = country ? {
        country_id: country.country_id,
        name: country.name,
        nameCode: country.nameCode
      } : null;
    }

    res.status(200).json({
      success: true,
      message: 'State updated successfully',
      data: stateObj
    });

  } catch (error) {
    console.error('Error updating state:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


module.exports = {
  createState,
  getAllStates,
  getStateById,
  getStateByCountry,
  updateState
}; 