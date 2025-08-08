const User = require('../models/user.model.js');
const Role = require('../models/role.model.js');
const { generateToken } = require('../utils/jwt.utils.js');
const { generateUniqueUserCode } = require('../utils/user-code.utils.js');
const { 
  createUserCreatedActivity, 
  createUserLoginActivity, 
  createUserProfileUpdatedActivity,
  createErrorActivity 
} = require('../utils/activity-feed.utils.js');

// Create a new user
const createUser = async (req, res) => {
  try {
    const { 
      name, 
      studio_name,
      email, 
      mobile, 
      password, 
      foreDigitsPin,
      country,
      state,
      city,
      pinCode,
      address, 
      printingNoOfAlbums,
      printingLabDesigningLab,
      printingMachineModelNo,
      gstNo,
      alternateNo,
      notifications_status,
      role_id, 
      user_img, 
      login_permission, 
      createdBy, 
      updatedBy 
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !mobile || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, mobile, password, and role_id are required'
      });
    }

    // Check if user already exists with email or mobile
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const existingUserByMobile = await User.findOne({ mobile });
    if (existingUserByMobile) {
      return res.status(409).json({
        success: false,
        message: 'User with this mobile number already exists'
      });
    }

    // Validate that role exists
    const existingRole = await Role.findOne({ role_id: parseInt(role_id) });
    if (!existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID provided'
      });
    }

    // Generate unique user code
    const userCode = await generateUniqueUserCode(User, 'user_code', 8, 10);

    // Create new user
    const newUser = new User({
      user_code: userCode,
      name,
      studio_name,
      email,
      mobile,
      password, // Note: In production, hash the password before saving
      foreDigitsPin,
      country,
      state,
      city,
      pinCode,
      address,
      printingNoOfAlbums,
      printingLabDesigningLab,
      printingMachineModelNo,
      gstNo,
      alternateNo,
      notifications_status,
      role_id,
      user_img,
      login_permission,
      createdBy,
      updatedBy
    });

    const savedUser = await newUser.save();

    // Create activity feed entry for user creation
    await createUserCreatedActivity(
      savedUser.user_id,
      savedUser.name,
      savedUser.user_id
    );

    // Populate role information manually
    const userObj = savedUser.toObject();
    if (userObj.role_id) {
      const role = await Role.findOne({ role_id: userObj.role_id });
      userObj.role = role ? {
        role_id: role.role_id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      } : null;
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: userObj._id,
        user_id: userObj.user_id,
        name: userObj.name,
        studio_name: userObj.studio_name,
        email: userObj.email,
        mobile: userObj.mobile,
        foreDigitsPin: userObj.foreDigitsPin,
        country: userObj.country,
        state: userObj.state,
        city: userObj.city,
        pinCode: userObj.pinCode,
        address: userObj.address,
        printingNoOfAlbums: userObj.printingNoOfAlbums,
        printingLabDesigningLab: userObj.printingLabDesigningLab,
        printingMachineModelNo: userObj.printingMachineModelNo,
        gstNo: userObj.gstNo,
        alternateNo: userObj.alternateNo,
        notifications_status: userObj.notifications_status,
        role_id: userObj.role_id,
        role: userObj.role,
        user_img: userObj.user_img,
        login_permission: userObj.login_permission,
        status: userObj.status,
        createdBy: userObj.createdBy,
        updatedBy: userObj.updatedBy,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Create error activity
    await createErrorActivity(
      0, // System error, no specific user
      'User Creation',
      error.message,
      0
    );
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    // Validate required fields
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Check if either email or mobile is provided
    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile is required'
      });
    }

    // Find user by email or mobile
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ mobile });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.status) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if user has login permission
    if (!user.login_permission) {
      return res.status(401).json({
        success: false,
        message: 'Login permission denied'
      });
    }

    // Check password (simple comparison for now)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user._id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role_id: user.role_id
    };

    const token = generateToken(tokenPayload);

    // Create activity feed entry for user login
    await createUserLoginActivity(
      user.user_id,
      user.name,
      user.user_id
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role_id: user.role_id,
          address: user.address,
          user_img: user.user_img,
          login_permission: user.login_permission,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token: token
      }
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    
    // Create error activity
    await createErrorActivity(
      0, // System error, no specific user
      'User Login',
      error.message,
      0
    );
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get user information
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create activity feed entry for logout
    await createUserLoginActivity(
      userId,
      user.name,
      userId
    );

    // In a more advanced implementation, you might want to:
    // 1. Add the token to a blacklist
    // 2. Update last logout time in user record
    // 3. Clear any session data

    res.status(200).json({
      success: true,
      message: 'User logged out successfully',
      data: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        logoutTime: new Date()
      }
    });

  } catch (error) {
    console.error('Error logging out user:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'User Logout',
        error.message,
        req.user.user_id
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role_id } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }
    if (role_id) {
      query.role_id = parseInt(role_id);
    }

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Populate role information manually since we're using numeric IDs
    const populatedUsers = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      if (userObj.role_id) {
        const role = await Role.findOne({ role_id: userObj.role_id });
        userObj.role = role ? {
          role_id: role.role_id,
          name: role.name,
          description: role.description,
          permissions: role.permissions
        } : null;
      }
      return userObj;
    }));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: populatedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID provided'
      });
    }

    // Try to find by user_id first (numeric ID)
    let user = await User.findOne({ user_id: numericId });
    
    // If not found by user_id, try to find by MongoDB _id (ObjectId)
    if (!user) {
      try {
        user = await User.findById(id);
      } catch (objectIdError) {
        // If ObjectId parsing fails, return not found
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Populate role information manually
    const userObj = user.toObject();
    if (userObj.role_id) {
      const role = await Role.findOne({ role_id: userObj.role_id });
      userObj.role = role ? {
        role_id: role.role_id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      } : null;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: userObj
    });

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user by user_id
const getUserByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findOne({ user_id: parseInt(user_id) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Populate role information manually
    const userObj = user.toObject();
    if (userObj.role_id) {
      const role = await Role.findOne({ role_id: userObj.role_id });
      userObj.role = role ? {
        role_id: role.role_id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      } : null;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: userObj
    });

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id, name, email, mobile, password, role_id, address, user_img, login_permission, status, updatedBy } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID provided'
      });
    }

    const user = await User.findOne({user_id: numericId});
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being updated and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, user_id: { $ne: id } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Check if mobile is being updated and if it already exists
    if (mobile && mobile !== user.mobile) {
      const existingUser = await User.findOne({ mobile, user_id: { $ne: id } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this mobile number already exists'
        });
      }
    }

    // Validate that role exists if being updated
    if (role_id) {
      const existingRole = await Role.findOne({ role_id: parseInt(role_id) });
      if (!existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID provided'
        });
      }
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { user_id: parseInt(id) },
      {
        name,
        email,
        mobile,
        password,
        role_id,
        address,
        user_img,
        login_permission,
        status,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    // Create activity feed entry for user profile update
    await createUserProfileUpdatedActivity(
      req.user.user_id,
      updatedUser.name,
      req.user.user_id
    );

    // Populate role information manually
    const userObj = updatedUser.toObject();
    if (userObj.role_id) {
      const role = await Role.findOne({ role_id: userObj.role_id });
      userObj.role = role ? {
        role_id: role.role_id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      } : null;
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userObj
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'User Update',
        error.message,
        req.user.user_id
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete user (soft delete by setting status to false)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID provided'
      });
    }

    const user = await User.findOne({user_id : numericId});
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by setting status to false
    const deletedUser = await User.findOneAndUpdate(
      { user_id: parseInt(id) },
      {
        status: false,
        updatedBy
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // Use user_id instead of id

    const user = await User.findOne({user_id : userId});
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Populate role information manually
    const userObj = user.toObject();
    if (userObj.role_id) {
      const role = await Role.findOne({ role_id: userObj.role_id });
      userObj.role = role ? {
        role_id: role.role_id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      } : null;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: userObj._id,
        user_id: userObj.user_id,
        name: userObj.name,
        email: userObj.email,
        mobile: userObj.mobile,
        role_id: userObj.role_id,
        role: userObj.role,
        address: userObj.address,
        user_img: userObj.user_img,
        login_permission: userObj.login_permission,
        status: userObj.status,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt
      }
    });

  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getUserById,
  getUserByUserId,
  updateUser,
  deleteUser,
  getProfile
}; 