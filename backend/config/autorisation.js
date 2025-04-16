const jwt =require("jsonwebtoken");
require('dotenv').config();
const userModel = require("../model/user");
const user = require("../model/user");



const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error('En-tête Authorization manquant ou malformé');
    return res.status(401).json({ message: 'Authentification requise' });
  }

  const token = authHeader.split(" ")[1];
  console.log('Token reçu:', token);

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('Erreur de vérification du token:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expiré' });
      }
      return res.status(403).json({ message: 'Token invalide' });
    }

    if (!decoded.userId) {
      console.error('userId manquant dans le payload du token');
      return res.status(400).json({ message: 'Token invalide: userId manquant.' });
    }

    req.user = { 
      userId: decoded.userId,
      role: decoded.role,
      project_id: decoded.project_id,
     };
    console.log('req.user après authentification:', req.user);
    next();
  });
};

module.exports = {
    authenticateJWT
};