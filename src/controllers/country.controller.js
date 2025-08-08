const Country = require('../models/country.model');
const User = require('../models/user.model');

// Create new country
const createCountry = async (req, res) => {
  try {
    const { name, nameCode } = req.body;
    const userId = req.user.user_id; // From auth middleware

    // Check if country with same name or nameCode already exists
    const existingCountry = await Country.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { nameCode: nameCode.toUpperCase() }
      ]
    });

    if (existingCountry) {
      return res.status(400).json({
        success: false,
        message: 'Country with this name or name code already exists'
      });
    }

    const country = new Country({
      name,
      nameCode,
      createdBy: userId,
      updatedBy: userId
    });

    await country.save();

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: country
    });
  } catch (error) {
    console.error('Error creating country:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update country
const updateCountry = async (req, res) => {
  try {
    const { country_id, name, nameCode, status } = req.body;
    const userId = req.user.user_id; // From auth middleware

    const country = await Country.findOne({ country_id: parseInt(country_id) });

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    // Check if updated name or nameCode conflicts with existing countries
    if (name || nameCode) {
      const existingCountry = await Country.findOne({
        $and: [
          { country_id: { $ne: parseInt(country_id) } },
          {
            $or: [
              { name: { $regex: new RegExp(`^${name || country.name}$`, 'i') } },
              { nameCode: (nameCode || country.nameCode).toUpperCase() }
            ]
          }
        ]
      });

      if (existingCountry) {
        return res.status(400).json({
          success: false,
          message: 'Country with this name or name code already exists'
        });
      }
    }

    // Update fields
    if (name) country.name = name;
    if (nameCode) country.nameCode = nameCode.toUpperCase();
    if (status !== undefined) country.status = status;
    
    country.updatedBy = userId;
    country.updatedAt = Date.now();

    await country.save();

    res.json({
      success: true,
      message: 'Country updated successfully',
      data: country
    });
  } catch (error) {
    console.error('Error updating country:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get country by ID
const getCountryById = async (req, res) => {
  try {
    const { country_id } = req.params;

    const country = await Country.findOne({ country_id: parseInt(country_id) });

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    // Populate user information manually
    const countryObj = country.toObject();
    if (countryObj.createdBy) {
      const createdByUser = await User.findOne({ user_id: countryObj.createdBy });
      countryObj.createdByUser = createdByUser ? {
        user_id: createdByUser.user_id,
        name: createdByUser.name,
        email: createdByUser.email
      } : null;
    }
    if (countryObj.updatedBy) {
      const updatedByUser = await User.findOne({ user_id: countryObj.updatedBy });
      countryObj.updatedByUser = updatedByUser ? {
        user_id: updatedByUser.user_id,
        name: updatedByUser.name,
        email: updatedByUser.email
      } : null;
    }

    res.json({
      success: true,
      data: countryObj
    });
  } catch (error) {
    console.error('Error getting country by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all countries
const getAllCountries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status !== undefined) {
      filter.status = status === 'true';
    }


    const countries = await Country.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate user information manually for all countries
    const populatedCountries = await Promise.all(countries.map(async (country) => {
      const countryObj = country.toObject();
      if (countryObj.createdBy) {
        const createdByUser = await User.findOne({ user_id: countryObj.createdBy });
        countryObj.createdByUser = createdByUser ? {
          user_id: createdByUser.user_id,
          name: createdByUser.name,
          email: createdByUser.email
        } : null;
      }
      if (countryObj.updatedBy) {
        const updatedByUser = await User.findOne({ user_id: countryObj.updatedBy });
        countryObj.updatedByUser = updatedByUser ? {
          user_id: updatedByUser.user_id,
          name: updatedByUser.name,
          email: updatedByUser.email
        } : null;
      }
      return countryObj;
    }));

    const total = await Country.countDocuments(filter);

    res.json({
      success: true,
      data: populatedCountries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting all countries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createCountry,
  updateCountry,
  getCountryById,
  getAllCountries
}; 