const AlbumShare = require('../models/album-share.model.js');
const User = require('../models/user.model.js');
const Albums = require('../models/albums.model.js');
const { 
  createAlbumSharedWithUserActivity,
  createErrorActivity 
} = require('../utils/activity-feed.utils.js');

// Create a new album share using sharelink (album.shaplink)
const createAlbumShare = async (req, res) => {
  try {
    const { type, shareLink } = req.params;

    // Validate required fields
    if (!shareLink || !type) {
      return res.status(400).json({
        success: false,
        message: 'Share link is required'
      });
    }
let shared_by = "";
    if (type === 'qr') {
      shared_by = 'QRCode';
    } else if (type === 'shap') {
      shared_by = 'Shaplink';
    }

    // Find album by shaplink
    const album = await Albums.findOne({ shaplink: shareLink });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found with the provided share link'
      });
    }

    // Check if user exists
    const user = await User.findOne({ user_id: req.user.user_id });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if album share already exists for this user and album
    const existingShare = await AlbumShare.findOne({
      user_id: req.user.user_id,
      album_id: album._id
    });

    if (existingShare) {
      return res.status(409).json({
        success: false,
        message: 'Album share already exists for this user and album'
      });
    }

    // Create new album share
    const newAlbumShare = new AlbumShare({
      user_id: req.user.user_id,
      album_id: album._id,
      description: `Album shared via ${album.createdBy}`,
      shared_by: shared_by,
      status: true,
      createdBy: req.user.user_id,
      updatedBy: req.user.user_id
    });

    const savedAlbumShare = await newAlbumShare.save();

    // Create activity feed entry for album sharing
    await createAlbumSharedWithUserActivity(
      req.user.user_id,
      album.album_title,
      user.name,
      req.user.user_id
    );

    // Populate user and album information
    const albumShareObj = savedAlbumShare.toObject();
    albumShareObj.user = {
      user_id: user.user_id,
      name: user.name,
      studio_name: user.studio_name,
      email: user.email,
      mobile: user.mobile
    };
    albumShareObj.album = {
      _id: album._id,
      albums_id: album.albums_id,
      album_title: album.album_title,
      event_type_id: album.event_type_id,
      event_date: album.event_date,
      client_name: album.client_name,
      album_no: album.album_no,
      shaplink: album.shaplink,
      album_orientation: album.album_orientation,
      fileType: album.fileType,
      numberOfPages: album.numberOfPages,
      coverPhoto: album.coverPhoto,
      generateQRCode: album.generateQRCode,
      setExpiryDate: album.setExpiryDate,
      enableDownloads: album.enableDownloads,
      passwordProtect: album.passwordProtect,
      addWaterMark: album.addWaterMark,
      addLogo: album.addLogo,
      status: album.status,
      createdAt: album.createdAt
    };

    // Get photographer information
    const photographer = await User.findOne({ user_id: album.photographer_id });
    if (photographer) {
      albumShareObj.photographer = {
        user_id: photographer.user_id,
        name: photographer.name,
        studio_name: photographer.studio_name,
        email: photographer.email,
        mobile: photographer.mobile
      };
    }

    res.status(201).json({
      success: true,
      message: 'Album share created successfully',
      data: albumShareObj
    });

  } catch (error) {
    console.error('Error creating album share:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'Album Share Creation',
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

// Create album share by sharelink (alternative function)
const createAlbumShareByLink = async (req, res) => {
  try {
    const {
      sharelink,
      user_id,
      description,
      shared_by = 'Shaplink'
    } = req.body;

    // Validate required fields
    if (!sharelink) {
      return res.status(400).json({
        success: false,
        message: 'Sharelink is required'
      });
    }

    // Find album by shaplink
    const album = await Albums.findOne({ shaplink: sharelink });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found with the provided sharelink'
      });
    }

    // Check if album is active
    if (!album.status) {
      return res.status(400).json({
        success: false,
        message: 'Album is not active'
      });
    }

    // Check if album has expired
    if (album.setExpiryDate && new Date() > new Date(album.setExpiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Album has expired'
      });
    }

    // If user_id is provided, validate user exists
    let user = null;
    if (user_id) {
      user = await User.findOne({ user_id: parseInt(user_id) });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if album share already exists for this user and album
      const existingShare = await AlbumShare.findOne({
        user_id: parseInt(user_id),
        album_id: album._id
      });

      if (existingShare) {
        return res.status(409).json({
          success: false,
          message: 'Album share already exists for this user and album'
        });
      }
    }

    // Create album share record if user_id is provided
    let savedAlbumShare = null;
    if (user_id) {
      const newAlbumShare = new AlbumShare({
        user_id: parseInt(user_id),
        album_id: album._id,
        description: description || `Album shared via ${shared_by}`,
        shared_by: shared_by,
        status: true,
        createdBy: req.user ? req.user.user_id : null,
        updatedBy: req.user ? req.user.user_id : null
      });

      savedAlbumShare = await newAlbumShare.save();

      // Create activity feed entry if user is authenticated
      if (req.user) {
        await createAlbumSharedWithUserActivity(
          req.user.user_id,
          album.album_title,
          user.name,
          req.user.user_id
        );
      }
    }

    // Get photographer information
    const photographer = await User.findOne({ user_id: album.photographer_id });

    const responseData = {
      album: {
        _id: album._id,
        albums_id: album.albums_id,
        album_title: album.album_title,
        event_type_id: album.event_type_id,
        event_date: album.event_date,
        client_name: album.client_name,
        album_no: album.album_no,
        shaplink: album.shaplink,
        album_orientation: album.album_orientation,
        fileType: album.fileType,
        numberOfPages: album.numberOfPages,
        upload_images: album.upload_images,
        upload_songs: album.upload_songs,
        reorder_images: album.reorder_images,
        coverPhoto: album.coverPhoto,
        generateQRCode: album.generateQRCode,
        setExpiryDate: album.setExpiryDate,
        enableDownloads: album.enableDownloads,
        passwordProtect: album.passwordProtect,
        addWaterMark: album.addWaterMark,
        addLogo: album.addLogo,
        status: album.status,
        createdAt: album.createdAt
      },
      photographer: photographer ? {
        user_id: photographer.user_id,
        name: photographer.name,
        studio_name: photographer.studio_name,
        email: photographer.email,
        mobile: photographer.mobile,
        user_img: photographer.user_img
      } : null,
      shareInfo: savedAlbumShare ? {
        albumShare_id: savedAlbumShare.albumShare_id,
        user_id: savedAlbumShare.user_id,
        description: savedAlbumShare.description,
        shared_by: savedAlbumShare.shared_by,
        status: savedAlbumShare.status,
        createdAt: savedAlbumShare.createdAt
      } : null,
      metadata: {
        totalImages: album.upload_images ? album.upload_images.length : 0,
        totalSongs: album.upload_songs ? album.upload_songs.length : 0,
        hasCoverPhoto: !!album.coverPhoto,
        hasPassword: !!album.passwordProtect,
        isExpired: album.setExpiryDate ? new Date() > new Date(album.setExpiryDate) : false,
        daysUntilExpiry: album.setExpiryDate ? Math.ceil((new Date(album.setExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
      }
    };

    res.status(200).json({
      success: true,
      message: user_id ? 'Album share created successfully' : 'Album details retrieved successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error creating album share by link:', error);
    
    // Create error activity if user is authenticated
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'Album Share By Link',
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

// Update album share
const updateAlbumShare = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Album Share ID is required in request body'
      });
    }

    // Check if album share exists
    const existingAlbumShare = await AlbumShare.findOne({ albumShare_id: parseInt(id) });
    if (!existingAlbumShare) {
      return res.status(404).json({
        success: false,
        message: 'Album share not found'
      });
    }

    // Check if user has permission to update this album share
    if (existingAlbumShare.createdBy !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this album share'
      });
    }

    // Remove album_id from updateData if it exists to prevent ObjectId casting issues
    const { album_id, ...safeUpdateData } = updateData;

    // Warn if someone tries to update album_id (this should be done through create/delete operations)
    if (album_id) {
      console.warn(`Attempt to update album_id in album share ${id}. This field should not be updated directly.`);
    }

    // Update the album share
    const updatedAlbumShare = await AlbumShare.findOneAndUpdate(
      { albumShare_id: parseInt(id) },
      {
        ...safeUpdateData,
        updatedBy: req.user.user_id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Populate user and album information
    const user = await User.findOne({ user_id: updatedAlbumShare.user_id });
    const album = await Albums.findById(updatedAlbumShare.album_id);
    const albumShareObj = updatedAlbumShare.toObject();

    if (user) {
      albumShareObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email
      };
    }

    if (album) {
      albumShareObj.album = {
        _id: album._id,
        albums_id: album.albums_id,
        album_title: album.album_title,
        event_type: album.event_type,
        client_name: album.client_name
      };
    }

    res.status(200).json({
      success: true,
      message: 'Album share updated successfully',
      data: albumShareObj
    });

  } catch (error) {
    console.error('Error updating album share:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update accept_share status
const updateAcceptShare = async (req, res) => {
  try {
    const { albumShare_id, accept_share } = req.body;

    // Validate required fields
    if (!albumShare_id || !accept_share) {
      return res.status(400).json({
        success: false,
        message: 'Album Share ID and accept_share status are required'
      });
    }

    // Validate accept_share value
    const validStatuses = ['Accepted', 'Rejected', 'Pending'];
    if (!validStatuses.includes(accept_share)) {
      return res.status(400).json({
        success: false,
        message: 'accept_share must be one of: Accepted, Rejected, Pending'
      });
    }

    // Check if album share exists
    const existingShare = await AlbumShare.findOne({ albumShare_id: parseInt(albumShare_id) });
    if (!existingShare) {
      return res.status(404).json({
        success: false,
        message: 'Album share not found'
      });
    }

    // Check if user has permission to update this share
    if (existingShare.user_id !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this album share'
      });
    }

    // Update the accept_share status
    const updatedShare = await AlbumShare.findOneAndUpdate(
      { albumShare_id: parseInt(albumShare_id) },
      {
        accept_share: accept_share,
        updatedBy: req.user.user_id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Get user and album information
    const user = await User.findOne({ user_id: updatedShare.user_id });
    const album = await Albums.findById(updatedShare.album_id);

    const shareObj = updatedShare.toObject();
    if (user) {
      shareObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email
      };
    }

    if (album) {
      shareObj.album = {
        _id: album._id,
        albums_id: album.albums_id,
        album_title: album.album_title,
        event_type_id: album.event_type_id,
        event_date: album.event_date,
        client_name: album.client_name
      };
    }

    res.status(200).json({
      success: true,
      message: `Album share ${accept_share.toLowerCase()} successfully`,
      data: shareObj
    });

  } catch (error) {
    console.error('Error updating accept share:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get album share by ID (check status true)
const getAlbumShareById = async (req, res) => {
  try {
    const { id } = req.params;

    const albumShare = await AlbumShare.findOne({ albumShare_id: id});
    if (!albumShare) {
      return res.status(404).json({
        success: false,
        message: 'Album share not found or inactive'
      });
    }

    // Check if user has permission to view this share
    if (albumShare.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this album share'
      });
    }

    // Populate user and album information
    const user = await User.findOne({ user_id: albumShare.user_id });
    const album = await Albums.findById(albumShare.album_id);
    const albumShareObj = albumShare.toObject();

    if (user) {
      albumShareObj.user = {
        user_id: user.user_id,
        name: user.name,
        studio_name: user.studio_name,
        email: user.email
      };
    }

    if (album) {
      albumShareObj.album = {
        _id: album._id,
        albums_id: album.albums_id,
        album_title: album.album_title,
        event_type: album.event_type,
        client_name: album.client_name
      };
    }

    res.status(200).json({
      success: true,
      data: albumShareObj
    });

  } catch (error) {
    console.error('Error getting album share by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get album shares by user ID (with auth)
const getAlbumSharesByUserId = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { user_id: req.user.user_id };

   

    // Add status filter
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const albumShares = await AlbumShare.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AlbumShare.countDocuments(query);

    // Populate user and album information for each album share
    const albumSharesWithDetails = await Promise.all(
      albumShares.map(async (albumShare) => {
        const user = await User.findOne({ user_id: albumShare.user_id });
        const album = await Albums.findById(albumShare.album_id);
        const albumShareObj = albumShare.toObject();

        if (user) {
          albumShareObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email
          };
        }

        if (album) {
          albumShareObj.album = {
            _id: album._id,
            albums_id: album.albums_id,
            album_title: album.album_title,
            event_type: album.event_type,
            client_name: album.client_name
          };
        }

        return albumShareObj;
      })
    );

    res.status(200).json({
      success: true,
      data: albumSharesWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting album shares by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all album shares (check status true)
const getAllAlbumShares = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      album_id
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { status: true };

   

    // Add other filters
    if (user_id) query.user_id = parseInt(user_id);
    if (album_id) {
      // Find the album by albums_id and use its _id for filtering
      const album = await Albums.findOne({ albums_id: parseInt(album_id) });
      if (album) {
        query.album_id = album._id;
      }
    }

    const albumShares = await AlbumShare.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AlbumShare.countDocuments(query);

    // Populate user and album information for each album share
    const albumSharesWithDetails = await Promise.all(
      albumShares.map(async (albumShare) => {
        const user = await User.findOne({ user_id: albumShare.user_id });
        const album = await Albums.findById(albumShare.album_id);
        const albumShareObj = albumShare.toObject();

        if (user) {
          albumShareObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email
          };
        }

        if (album) {
          albumShareObj.album = {
            _id: album._id,
            albums_id: album.albums_id,
            album_title: album.album_title,
            event_type: album.event_type,
            client_name: album.client_name
          };
        }

        return albumShareObj;
      })
    );

    res.status(200).json({
      success: true,
      data: albumSharesWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all album shares:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all share requests with auth
const getAllShareRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    // If user is not admin, only show their shares
    if (req.user.role_id !== 1) {
      query.user_id = req.user.user_id;
    }


    // Add status filter
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const albumShares = await AlbumShare.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AlbumShare.countDocuments(query);

    // Populate user and album information for each share
    const albumSharesWithDetails = await Promise.all(
      albumShares.map(async (albumShare) => {
        const user = await User.findOne({ user_id: albumShare.user_id });
        const album = await Albums.findById(albumShare.album_id);
        const albumShareObj = albumShare.toObject();

        if (user) {
          albumShareObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email
          };
        }

        if (album) {
          albumShareObj.album = {
            _id: album._id,
            albums_id: album.albums_id,
            album_title: album.album_title,
            event_type_id: album.event_type_id,
            event_date: album.event_date,
            client_name: album.client_name,
            album_no: album.album_no,
            shaplink: album.shaplink
          };
        }

        return albumShareObj;
      })
    );

    res.status(200).json({
      success: true,
      data: albumSharesWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all share requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get share requests by album with auth
const getShareRequestsByAlbum = async (req, res) => {
  try {
    const { album_id } = req.params;
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    // Find the album by albums_id and use its _id for filtering
    const album = await Albums.findOne({ albums_id: parseInt(album_id) });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    query.album_id = album._id;

    // If user is not admin, check if they own the album or have shares
    if (req.user.role_id !== 1) {
      if (album.photographer_id !== req.user.user_id) {
        // Check if user has any shares for this album
        const userShare = await AlbumShare.findOne({
          album_id: album._id,
          user_id: req.user.user_id
        });
        if (!userShare) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view shares for this album'
          });
        }
      }
    }

 

    // Add status filter
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const albumShares = await AlbumShare.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AlbumShare.countDocuments(query);

    // Populate user information for each share
    const albumSharesWithDetails = await Promise.all(
      albumShares.map(async (albumShare) => {
        const user = await User.findOne({ user_id: albumShare.user_id });
        const albumShareObj = albumShare.toObject();

        if (user) {
          albumShareObj.user = {
            user_id: user.user_id,
            name: user.name,
            studio_name: user.studio_name,
            email: user.email
          };
        }

        albumShareObj.album = {
          _id: album._id,
          albums_id: album.albums_id,
          album_title: album.album_title,
          event_type_id: album.event_type_id,
          event_date: album.event_date,
          client_name: album.client_name,
          album_no: album.album_no,
          shaplink: album.shaplink
        };

        return albumShareObj;
      })
    );

    res.status(200).json({
      success: true,
      data: albumSharesWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting share requests by album:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createAlbumShare,
  createAlbumShareByLink,
  updateAlbumShare,
  updateAcceptShare,
  getAlbumShareById,
  getAlbumSharesByUserId,
  getAllAlbumShares,
  getAllShareRequests,
  getShareRequestsByAlbum
}; 