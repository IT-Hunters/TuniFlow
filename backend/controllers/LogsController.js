// controllers/logController.js
const Log = require('../model/Logs/Log');

const getLogsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { url } = req.query; // Get URL filter from query parameters

    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // Build query object
    const query = { 
      projectId,
      method: { $in: ['POST', 'PUT', 'DELETE'] } 
    };

    const logs = await Log.find(query).sort({ timestamp: -1 });

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs by project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLogsByProject,
};