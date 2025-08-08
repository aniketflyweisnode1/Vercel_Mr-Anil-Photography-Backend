const City = require('../models/city.model.js');
const State = require('../models/state.model.js');

// Create a new city
const createCity = async (req, res) => {
  try {
    const { name, state_id } = req.body;
    
    // Validate required fields
    if (!name || !state_id) {
      return res.status(400).json({
        success: false,
        message: 'City name and state_id are required'
      });
    }

    // Check if state exists
    const existingState = await State.findOne({ state_id: parseInt(state_id) });
    if (!existingState) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    // Check if city already exists in the same state
    const existingCity = await City.findOne({ name, state_id: parseInt(state_id) });
    if (existingCity) {
      return res.status(409).json({
        success: false,
        message: 'City with this name already exists in the selected state'
      });
    }
const createdBy = req.user.user_id
    // Create new city
    const newCity = new City({
      name,
      state_id: parseInt(state_id),
      createdBy
    });

    const savedCity = await newCity.save();

    // Fetch state information for the response
    const state = await State.findOne({ state_id: savedCity.state_id });
    const cityObj = savedCity.toObject();
    cityObj.state = state ? {
      state_id: state.state_id,
      name: state.name,
      code: state.code
    } : null;

    res.status(201).json({
      success: true,
      message: 'City created successfully',
      data: cityObj
    });

  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all cities
const getAllCities = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, state_id } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }
    if (state_id) {
      query.state_id = parseInt(state_id);
    }

    const cities = await City.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get all unique state_ids from the cities
    const stateIds = [...new Set(cities.map(city => city.state_id))];
    
    // Fetch all states in one query
    const states = await State.find({ state_id: { $in: stateIds } });
    
    // Create a map for quick lookup
    const stateMap = {};
    states.forEach(existingState => {
      stateMap[existingState.state_id] = {
        state_id: existingState.state_id,
        name: existingState.name,
        code: existingState.code
      };
    });

    // Add state information to each city
    const citiesWithState = cities.map(city => {
      const cityObj = city.toObject();
      cityObj.state = stateMap[city.state_id] || null;
      return cityObj;
    });

    const total = await City.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Cities retrieved successfully',
      data: citiesWithState,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting cities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get city by ID
const getCityById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid City ID provided'
      });
    }

    // Try to find by city_id first (numeric ID)
    let city = await City.findOne({ city_id: numericId });
    
    // If not found by city_id, try to find by MongoDB _id (ObjectId)
    if (!city) {
      try {
        city = await City.findById(id);
      } catch (objectIdError) {
        // If ObjectId parsing fails, return not found
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }
    }

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    // Fetch state information
    const state = await State.findOne({ state_id: city.state_id });
    const cityObj = city.toObject();
    cityObj.state = state ? {
      state_id: state.state_id,
      name: state.name,
      code: state.code
    } : null;

    res.status(200).json({
      success: true,
      message: 'City retrieved successfully',
      data: cityObj
    });

  } catch (error) {
    console.error('Error getting city:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Get cities by state_id
const getCitiesByStateId = async (req, res) => {
  try {
    const { state_id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { state_id: parseInt(state_id) };
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const cities = await City.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    // Fetch state information
    const state = await State.findOne({ state_id: parseInt(state_id) });
    
    // Add state information to each city
    const citiesWithState = cities.map(city => {
      const cityObj = city.toObject();
      cityObj.state = state ? {
        state_id: state.state_id,
        name: state.name,
        code: state.code
      } : null;
      return cityObj;
    });

    const total = await City.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Cities retrieved successfully',
      data: citiesWithState,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting cities by state:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update city
const updateCity = async (req, res) => {
  try {
    const { id, name, state_id, status, updatedBy } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'City ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid City ID provided'
      });
    }

    // Try to find by city_id first (numeric ID)
    let city = await City.findOne({ city_id: numericId });
    
    // If not found by city_id, try to find by MongoDB _id (ObjectId)
    if (!city) {
      try {
        city = await City.findById(id);
      } catch (objectIdError) {
        // If ObjectId parsing fails, return not found
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }
    }

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    // Check if state_id is being updated and if state exists
    if (state_id && state_id !== city.state_id) {
      const state = await State.findOne({ state_id: parseInt(state_id) });
      if (!state) {
        return res.status(404).json({
          success: false,
          message: 'State not found'
        });
      }
    }

    // Check if name is being updated and if it already exists in the same state
    if (name && name !== city.name) {
      const existingCity = await City.findOne({ 
        name, 
        state_id: state_id || city.state_id,
        _id: { $ne: city._id } 
      });
      if (existingCity) {
        return res.status(409).json({
          success: false,
          message: 'City with this name already exists in the selected state'
        });
      }
    }

    // Update city using the correct ID
    const updatedCity = await City.findByIdAndUpdate(
      city._id,
      {
        name,
        state_id: state_id ? parseInt(state_id) : city.state_id,
        status,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    // Fetch state information for the response
    const state = await State.findOne({ state_id: updatedCity.state_id });
    const cityObj = updatedCity.toObject();
    cityObj.state = state ? {
      state_id: state.state_id,
      name: state.name,
      code: state.code
    } : null;

    res.status(200).json({
      success: true,
      message: 'City updated successfully',
      data: cityObj
    });

  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


module.exports = {
  createCity,
  getAllCities,
  getCityById,
  getCitiesByStateId,
  updateCity
}; 