const Log = require('../model/Logs/Log');
const jwt = require('jsonwebtoken');

const logger = async (req, res, next) => {
  const start = Date.now();
    const originalEnd = res.end;
  res.end = function (...args) {
    const responseTime = Date.now() - start;
    let userId = req.user ? req.user.userId : null;
    console.log('req.user:', req.user);
    console.log('Request URL:', req.originalUrl);
    console.log('Request Method:', req.method);
    let projectId = req.user && req.user.project_id ? req.user.project_id : null
    if (req.method === 'POST' && req.originalUrl.includes('/login') && res.statusCode === 200) {
      try {
        const responseBody = args[0] ? JSON.parse(args[0].toString()) : {};
        const token = responseBody.token;
        if (token) {
          // Decode JWT to get payload
          const decoded = jwt.verify(token, process.env.SECRET_KEY);
          userId = decoded.userId || null;
          projectId = decoded.project_id || null;
          console.log("userIdddddddddd : " + userId);
        }
      } catch (err) {
        console.error('Error parsing or decoding login response:', err);
      }
    }

    // Extract relevant data
    const log = new Log({
      userId : userId,
      action: determineAction(req),
      url: req.originalUrl,
      method: req.method,
      projectId: projectId,
      statusCode: res.statusCode,
      responseTime,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });

    // Save log to MongoDB
    log.save().catch((err) => console.error('Logging error:', err));

    // Call original res.end
    originalEnd.apply(this, args);
  };

  next();
};

// Helper function to determine action (customize as needed)
function determineAction(req) {
  if (req.method === 'POST' && req.originalUrl.includes('/login')) return 'login';
  if (req.method === 'GET' && req.originalUrl.includes('/profile')) return 'view_profile';
  return `${req.method.toLowerCase()}_${req.originalUrl.split('/').pop()}`; // Fallback
}

module.exports = logger;