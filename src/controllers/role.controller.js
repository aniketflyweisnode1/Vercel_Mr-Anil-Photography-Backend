const Role = require('../models/role.model.js');

// Create a new role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions, createdBy, updatedBy } = req.body;
    
    // Validate required fields

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create new role
    const newRole = new Role({
      name,
      description,
      permissions,
      createdBy,
      updatedBy
    });

    const savedRole = await newRole.save();

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: {
        id: savedRole._id,
        role_id: savedRole.role_id,
        name: savedRole.name,
        description: savedRole.description,
        permissions: savedRole.permissions,
        status: savedRole.status,
        createdBy: savedRole.createdBy,
        updatedBy: savedRole.updatedBy,
        createdAt: savedRole.createdAt,
        updatedAt: savedRole.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const roles = await Role.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Role.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Role ID provided'
      });
    }

    // Try to find by role_id first (numeric ID)
    let role = await Role.findOne({ role_id: numericId });
    
    // If not found by role_id, try to find by MongoDB _id (ObjectId)
    if (!role) {
      try {
        role = await Role.findById(id);
      } catch (objectIdError) {
        // If ObjectId parsing fails, return not found
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
    }

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role retrieved successfully',
      data: role
    });

  } catch (error) {
    console.error('Error getting role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Update role
const updateRole = async (req, res) => {
  try {
    const { id, name, description, permissions, status, updatedBy } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required'
      });
    }

    // Validate that id is a valid number
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Role ID provided'
      });
    }

    // Try to find by role_id first (numeric ID)
    let role = await Role.findOne({ role_id: numericId });
    
    // If not found by role_id, try to find by MongoDB _id (ObjectId)
    if (!role) {
      try {
        role = await Role.findById(id);
      } catch (objectIdError) {
        // If ObjectId parsing fails, return not found
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
    }

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if name is being updated and if it already exists
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name, _id: { $ne: role._id } });
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }
    }

    // Update role using the correct ID
    const updatedRole = await Role.findByIdAndUpdate(
      role._id,
      {
        name,
        description,
        permissions,
        status,
        updatedBy
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRole
    });

  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};



module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole
}; 