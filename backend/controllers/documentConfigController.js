const DocumentConfig = require('../models/DocumentConfig');

/**
 * @desc    Get document configuration
 * @route   GET /api/admin/document-config
 * @access  Private/Admin
 */
const getDocumentConfig = async (req, res) => {
  try {
    const config = await DocumentConfig.getConfig();
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching document configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document configuration',
      error: error.message
    });
  }
};

/**
 * @desc    Update document configuration
 * @route   POST /api/admin/document-config
 * @access  Private/Admin
 */
const updateDocumentConfig = async (req, res) => {
  try {
    const config = await DocumentConfig.findOne();
    const configData = req.body;
    
    if (!config) {
      // Create new configuration with the provided data
      const newConfig = await DocumentConfig.create({});
      
      // Update the newly created config with the data from the request
      Object.keys(configData).forEach(key => {
        if (newConfig[key] && typeof configData[key] === 'object') {
          newConfig[key] = { ...newConfig[key], ...configData[key] };
        }
      });
      
      await newConfig.save();
      
      return res.status(201).json({
        success: true,
        message: 'Document configuration created successfully',
        data: newConfig
      });
    }
    
    // Update existing config with all provided fields
    Object.keys(configData).forEach(key => {
      if (config[key] && typeof configData[key] === 'object') {
        // For each document type, update its properties
        config[key] = {
          ...config[key],
          ...configData[key]
        };
      }
    });
    
    await config.save();
    
    res.status(200).json({
      success: true,
      message: 'Document configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating document configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document configuration',
      error: error.message
    });
  }
};

module.exports = {
  getDocumentConfig,
  updateDocumentConfig
};
