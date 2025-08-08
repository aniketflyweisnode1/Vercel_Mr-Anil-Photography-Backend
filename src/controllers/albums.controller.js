const Albums = require('../models/albums.model.js');
const User = require('../models/user.model.js');
const AlbumShare = require('../models/album-share.model.js');
const EventType = require('../models/event-type.model.js'); // Added import for EventType
const { 
  createAlbumCreatedActivity, 
  createAlbumUpdatedActivity, 
  createAlbumViewActivity, 
  createAlbumPasswordActivity,
  createShaplinkGeneratedActivity,
  createErrorActivity,
  createQRCodeGeneratedActivity
} = require('../utils/activity-feed.utils.js');

// Create a new album
const createAlbum = async (req, res) => {
  try {
    const {
      photographer_id,
      album_title,
      event_type_id, // Changed from event_type to event_type_id
      event_date,
      client_name,
      client_contactNo,
      album_orientation,
      fileType,
      numberOfPages,
      upload_images,
      upload_songs,
      reorder_images,
      coverPhoto,
      generateQRCode,
      setExpiryDate,
      enableDownloads,
      passwordProtect,
      addWaterMark,
      addLogo,
      status
    } = req.body;

    // Validate required fields
    if (!photographer_id || !album_title || !event_type_id || !event_date || !client_name || !client_contactNo || !numberOfPages) {
      return res.status(400).json({
        success: false,
        message: 'Photographer ID, album title, event type ID, event date, client name, client contact number, and number of pages are required'
      });
    }

    // Check if photographer exists
    const photographer = await User.findOne({ user_id: parseInt(photographer_id) });
    if (!photographer) {
      return res.status(400).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    // Check if event type exists
    const eventType = await EventType.findOne({ event_type_id: parseInt(event_type_id) });
    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type not found'
      });
    }

    // Generate album number
    const album_no = await Albums.generateAlbumNumber();

    // Generate shaplink: album_no + album_title + user_id
    const shaplink = `${album_no}${Date.now().toString()}${photographer_id}`;

    // Create new album
    const newAlbum = new Albums({
      photographer_id: parseInt(photographer_id),
      album_title,
      event_type_id: parseInt(event_type_id), // Use event_type_id instead of event_type
      event_date: new Date(event_date),
      client_name,
      client_contactNo,
      album_no,
      shaplink,
      album_orientation,
      fileType,
      numberOfPages,
      upload_images: upload_images || [],
      upload_songs: upload_songs || [],
      reorder_images: reorder_images || [],
      coverPhoto,
      generateQRCode,
      setExpiryDate: setExpiryDate ? new Date(setExpiryDate) : null,
      enableDownloads,
      passwordProtect,
      addWaterMark,
      addLogo,
      status,
      createdBy: req.user.user_id,
      updatedBy: req.user.user_id
    });

    const savedAlbum = await newAlbum.save();

    // Create activity feed entry for album creation
    await createAlbumCreatedActivity(
      req.user.user_id,
      savedAlbum.album_title,
      req.user.user_id
    );

    // Create activity feed entry for shaplink generation
    await createShaplinkGeneratedActivity(
      req.user.user_id,
      savedAlbum.shaplink,
      req.user.user_id
    );

    // Populate photographer information
    const albumObj = savedAlbum.toObject();
    albumObj.photographer = {
      user_id: photographer.user_id,
      name: photographer.name,
      studio_name: photographer.studio_name,
      email: photographer.email
    };

    res.status(201).json({
      success: true,
      message: 'Album created successfully',
      data: albumObj
    });

  } catch (error) {
    console.error('Error creating album:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'Album Creation',
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

// Update album
const updateAlbum = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Album ID is required in request body'
      });
    }

    // Check if album exists
    const existingAlbum = await Albums.findOne({ albums_id: id });
    if (!existingAlbum) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Check if user has permission to update this album
    if (existingAlbum.photographer_id !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this album'
      });
    }

    // Update the album
    const updatedAlbum = await Albums.findOneAndUpdate(
      { albums_id: id },
      {
        ...updateData,
        updatedBy: req.user.user_id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Create activity feed entry for album update
    await createAlbumUpdatedActivity(
      req.user.user_id,
      updatedAlbum.album_title,
      req.user.user_id
    );

    // If password was set, create specific activity
    if (updateData.passwordProtect) {
      await createAlbumPasswordActivity(
        req.user.user_id,
        updatedAlbum.album_title,
        req.user.name || 'Unknown User',
        req.user.user_id
      );
    }

    // Populate photographer information
    const photographer = await User.findOne({ user_id: updatedAlbum.photographer_id });
    const albumObj = updatedAlbum.toObject();
    if (photographer) {
      albumObj.photographer = {
        user_id: photographer.user_id,
        name: photographer.name,
        studio_name: photographer.studio_name,
        email: photographer.email
      };
    }

    res.status(200).json({
      success: true,
      message: 'Album updated successfully',
      data: albumObj
    });

  } catch (error) {
    console.error('Error updating album:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'Album Update',
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

// Get album by ID with full details
const getAlbumById = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Albums.findOne({ albums_id: id });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Create activity feed entry for album view (if user is authenticated)
    if (req.user) {
      await createAlbumViewActivity(
        req.user.user_id,
        album.album_title,
        1, // Default view count
        req.user.user_id
      );
    }

    // Populate photographer information
    const photographer = await User.findOne({ user_id: album.photographer_id });
    const albumObj = album.toObject();
    
    if (photographer) {
      albumObj.photographer = {
        user_id: photographer.user_id,
        name: photographer.name,
        studio_name: photographer.studio_name,
        email: photographer.email,
        mobile: photographer.mobile,
        alternateNo: photographer.alternateNo,
        country: photographer.country,
        state: photographer.state,
        city: photographer.city,
        address: photographer.address,
        gstNo: photographer.gstNo,
        user_img: photographer.user_img
      };
    }

    // Get share information if user is authenticated
    if (req.user) {
      const shareInfo = await AlbumShare.findOne({
        album_id: album._id,
        user_id: req.user.user_id,
        status: true,
        accept_share: 'Accepted'
      });

      if (shareInfo) {
        albumObj.isShared = true;
        albumObj.shareInfo = {
          albumShare_id: shareInfo.albumShare_id,
          description: shareInfo.description,
          sharedAt: shareInfo.createdAt,
          sharedBy: shareInfo.createdBy
        };
      } else {
        albumObj.isShared = false;
      }

      // Check if user is the owner
      albumObj.isOwner = album.photographer_id === req.user.user_id;
    }

    // Get all shares for this album (if user is owner or admin)
    if (req.user && (album.photographer_id === req.user.user_id || req.user.role_id === 1)) {
      const allShares = await AlbumShare.find({ album_id: album.albums_id, accept_share: 'Accepted' });
      
      // Manually populate user information for each share
      const allSharesWithUser = await Promise.all(
        allShares.map(async (share) => {
          const user = await User.findOne({ user_id: share.user_id });
          return {
            albumShare_id: share.albumShare_id,
            user_id: share.user_id,
            userName: user ? user.name : 'Unknown User',
            userEmail: user ? user.email : 'Unknown Email',
            description: share.description,
            status: share.status,
            sharedAt: share.createdAt,
            sharedBy: share.createdBy
          };
        })
      );
      
      albumObj.allShares = allSharesWithUser;
    }

    // Add metadata
    albumObj.metadata = {
      totalImages: album.upload_images ? album.upload_images.length : 0,
      totalSongs: album.upload_songs ? album.upload_songs.length : 0,
      hasCoverPhoto: !!album.coverPhoto,
      hasPassword: !!album.passwordProtect,
      isExpired: album.setExpiryDate ? new Date() > new Date(album.setExpiryDate) : false,
      daysUntilExpiry: album.setExpiryDate ? Math.ceil((new Date(album.setExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };

    // Add permissions based on user role and ownership
    if (req.user) {
      albumObj.permissions = {
        canEdit: album.photographer_id === req.user.user_id || req.user.role_id === 1,
        canDelete: album.photographer_id === req.user.user_id || req.user.role_id === 1,
        canShare: album.photographer_id === req.user.user_id || req.user.role_id === 1,
        canDownload: album.enableDownloads || album.photographer_id === req.user.user_id || req.user.role_id === 1,
        canView: true // If they can access this endpoint, they can view
      };
    }

    res.status(200).json({
      success: true,
      data: albumObj
    });

  } catch (error) {
    console.error('Error getting album by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all albums with pagination and filtering
const getAllAlbums = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      event_type,
      album_orientation,
      fileType,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

  

    // Add other filters
    if (event_type) query.event_type = event_type;
    if (album_orientation) query.album_orientation = album_orientation;
    if (fileType) query.fileType = fileType;
    if (status !== undefined) query.status = status === 'true';

    const albums = await Albums.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Albums.countDocuments(query);

    // Populate photographer information for each album
    const albumsWithPhotographer = await Promise.all(
      albums.map(async (album) => {
        const photographer = await User.findOne({ user_id: album.photographer_id });
        const albumObj = album.toObject();
        if (photographer) {
          albumObj.photographer = {
            user_id: photographer.user_id,
            name: photographer.name,
            studio_name: photographer.studio_name,
            email: photographer.email
          };
        }
        return albumObj;
      })
    );

    res.status(200).json({
      success: true,
      data: albumsWithPhotographer,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all albums:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get albums by authenticated user ID (including shared albums)
const getAlbumsByAuthId = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      event_type,
      album_orientation,
      fileType,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's own albums
    const ownAlbumsQuery = { photographer_id: req.user.user_id };
    
    // Get shared albums for this user
    const sharedAlbums = await AlbumShare.find({ 
      user_id: req.user.user_id, 
      status: true,
      accept_share: 'Accepted'
    }).populate('album_id');
    
    const sharedAlbumIds = sharedAlbums.map(share => share.album_id._id);

    // Combine queries for own albums and shared albums
    const combinedQuery = {
      $or: [
        ownAlbumsQuery,
        { _id: { $in: sharedAlbumIds } }
      ]
    };

  

    // Add other filters
    if (event_type) {
      if (!combinedQuery.$and) combinedQuery.$and = [];
      combinedQuery.$and.push({ event_type });
    }
    if (album_orientation) {
      if (!combinedQuery.$and) combinedQuery.$and = [];
      combinedQuery.$and.push({ album_orientation });
    }
    if (fileType) {
      if (!combinedQuery.$and) combinedQuery.$and = [];
      combinedQuery.$and.push({ fileType });
    }
    if (status !== undefined) {
      if (!combinedQuery.$and) combinedQuery.$and = [];
      combinedQuery.$and.push({ status: status === 'true' });
    }

    const albums = await Albums.find(combinedQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Albums.countDocuments(combinedQuery);

    // Populate photographer information and add share info for each album
    const albumsWithDetails = await Promise.all(
      albums.map(async (album) => {
        const photographer = await User.findOne({ user_id: album.photographer_id });
        const albumObj = album.toObject();
        
        if (photographer) {
          albumObj.photographer = {
            user_id: photographer.user_id,
            name: photographer.name,
            studio_name: photographer.studio_name,
            email: photographer.email
          };
        }

        // Check if this album is shared with the user
        const shareInfo = sharedAlbums.find(share => 
          share.album_id._id.toString() === album._id.toString()
        );
        
        if (shareInfo) {
          albumObj.isShared = true;
          albumObj.shareInfo = {
            albumShare_id: shareInfo.albumShare_id,
            description: shareInfo.description,
            sharedAt: shareInfo.createdAt
          };
        } else {
          albumObj.isShared = false;
        }

        return albumObj;
      })
    );

    res.status(200).json({
      success: true,
      data: albumsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting albums by auth ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check album existence and basic info
const checkAlbum = async (req, res) => {
  try {
    const { album_id, shaplink } = req.body;

    if (!album_id && !shaplink) {
      return res.status(400).json({
        success: false,
        message: 'Either album_id or shaplink is required'
      });
    }

    let query = {};
    if (album_id) {
      query.album_id = parseInt(album_id);
    } else if (shaplink) {
      query.shaplink = shaplink;
    }

    const album = await Albums.findOne(query);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Get photographer information
    const photographer = await User.findOne({ user_id: album.photographer_id });

    const albumInfo = {
      album_id: album.album_id,
      album_title: album.album_title,
      event_type: album.event_type,
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
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      photographer: photographer ? {
        user_id: photographer.user_id,
        name: photographer.name,
        studio_name: photographer.studio_name,
        email: photographer.email
      } : null
    };

    res.status(200).json({
      success: true,
      message: 'Album found',
      data: albumInfo
    });

  } catch (error) {
    console.error('Error checking album:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Admin search albums by name and event date (created and shared albums only)
const adminSearchAlbums = async (req, res) => {
  try {
    const { 
      album_title, 
      event_date, 
      page = 1, 
      limit = 10,
      start_date,
      end_date,
      event_type,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    // Search by album title (case-insensitive)
    if (album_title) {
      query.album_title = { $regex: album_title, $options: 'i' };
    }

    // Search by specific event date
    if (event_date) {
      const searchDate = new Date(event_date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.event_date = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    // Search by date range
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      endDate.setDate(endDate.getDate() + 1); // Include the end date
      
      query.event_date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Filter by event type
    if (event_type) {
      query.event_type = event_type;
    }

    // Filter by status (only created and shared albums)
    if (status) {
      query.status = status === 'true';
    } else {
      // Default: only show created and shared albums
      query.status = { $in: [true, false] }; // Both active and inactive albums
    }

    // Get albums with pagination
    const albums = await Albums.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Albums.countDocuments(query);

    // Populate photographer information and share details
    const albumsWithDetails = await Promise.all(
      albums.map(async (album) => {
        const photographer = await User.findOne({ user_id: album.photographer_id });
        const albumObj = album.toObject();  
        if (photographer) {
          albumObj.photographer = {
            user_id: photographer.user_id,
            name: photographer.name,
            studio_name: photographer.studio_name,
            email: photographer.email,
            contact_no: photographer.contact_no
          };
        }

        // Get share information
        const shareInfo = await AlbumShare.findOne({ album_id: album._id, accept_share: 'Accepted' });
        albumObj.isShared = !!shareInfo;
        if (shareInfo) {
          albumObj.shareInfo = {
            albumShare_id: shareInfo.albumShare_id,
            description: shareInfo.description,
            sharedAt: shareInfo.createdAt,
            isActive: shareInfo.isActive
          };
        }

        return albumObj;
      })
    );

    res.status(200).json({
      success: true,
      message: 'Albums found',
      data: albumsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      filters: {
        album_title,
        event_date,
        start_date,
        end_date,
        event_type,
        status
      }
    });

  } catch (error) {
    console.error('Error in admin search albums:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Share albums by link
const shareAlbumsBylink = async (req, res) => {
  try {
    const { album_id } = req.params;
    console.log("album_id", album_id);
    // Find the album by ID
    const album = await Albums.findOne({ albums_id: album_id });
    console.log("album", album);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Check if album has a shaplink
    if (!album.shaplink) {
      return res.status(400).json({
        success: false,
        message: 'Album does not have a share link generated'
      });
    }

    // Get base URL from environment or use default
    const baseUrl = "http://localhost:3004";
    
    // Construct the share link
    

    // Get photographer information
    const photographer = await User.findOne({ user_id: album.photographer_id });
    const shareLink = `${baseUrl}/albums/share/shap/${album.shaplink}`;
    const responseData = {
      album_id: album.albums_id,
      album_title: album.album_title,
      album_no: album.album_no,
      shaplink: album.shaplink,
      shareLink: shareLink,
      photographer: photographer ? {
        user_id: photographer.user_id,
        name: photographer.name,
        studio_name: photographer.studio_name,
        email: photographer.email
      } : null,
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

    res.status(200).json({
      success: true,
      message: 'Album share link generated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error sharing album by link:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Share albums by QR code
const shareAlbumsByQR = async (req, res) => {
  try {
    const { album_id } = req.params;

    // Find the album by ID
    const album = await Albums.findOne({ albums_id: parseInt(album_id) });
    
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Check if album has a shaplink
    if (!album.shaplink) {
      return res.status(400).json({
        success: false,
        message: 'Album does not have a share link generated'
      });
    }

    // Get base URL from environment
    const baseUrl = "http://localhost:3004";
    
    if (!baseUrl) {
      return res.status(500).json({
        success: false,
        message: 'Base URL not configured'
      });
    }
    
    // Construct the share link
    const shareLink = `${baseUrl}/albums/share/qr/${album.shaplink}`;

    // Generate QR code as PNG buffer
    const QRCode = require('qrcode');
    const qrCodeBuffer = await QRCode.toBuffer(shareLink, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Set response headers for PNG image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-code-${album.albums_id}.png"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    const photographer = await User.findOne({ user_id: album.photographer_id });
    const responseData = {
      album_id: album.albums_id,
      album_title: album.album_title,
      album_no: album.album_no,
      shaplink: album.shaplink,
      shareLink: shareLink,
      photographer: photographer ? {
        user_id: photographer.user_id,
        name: photographer.name,
        studio_name: photographer.studio_name,
        email: photographer.email
      } : null,
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
    // Return the PNG image directly
    res.status(200).send(qrCodeBuffer, responseData);

    // Create activity feed entry for QR code generation
    await createQRCodeGeneratedActivity(
      req.user.user_id,
      album.album_title,
      req.user.user_id
    );

  } catch (error) {
    console.error('Error generating QR code for album:', error);
    
    // Create error activity
    if (req.user) {
      await createErrorActivity(
        req.user.user_id,
        'QR Code Generation',
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

module.exports = {
  createAlbum,
  updateAlbum,
  getAlbumById,
  getAllAlbums,
  getAlbumsByAuthId,
  checkAlbum,
  adminSearchAlbums,
  shareAlbumsBylink,
  shareAlbumsByQR
}; 