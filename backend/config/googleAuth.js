const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Charger les identifiants depuis certificates.js
const credentials = require('./certificates');

// Configurer le client OAuth2
const { client_id, client_secret, redirect_uris } = credentials.web;
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  'http://localhost:3000/callback' // Ajuster le redirect_uri
);

// Scopes nécessaires pour Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Générer une URL d'autorisation
function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    redirect_uri: 'http://localhost:3000/callback' // Ajuster ici
  });
}

// Obtenir un jeton d'accès à partir du code retourné
async function getAccessToken(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Sauvegarder les jetons pour une utilisation future
    fs.writeFileSync(
      path.join(__dirname, 'token.json'),
      JSON.stringify(tokens, null, 2)
    );
    return tokens;
  } catch (error) {
    throw new Error(`Erreur lors de l'obtention du jeton: ${error.message}`);
  }
}

// Charger les jetons existants (si disponibles)
function loadTokens() {
  try {
    const tokenPath = path.join(__dirname, 'token.json');
    if (fs.existsSync(tokenPath)) {
      const tokens = JSON.parse(fs.readFileSync(tokenPath));
      oauth2Client.setCredentials(tokens);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des jetons:', error);
  }
}

module.exports = {
  oauth2Client,
  getAuthUrl,
  getAccessToken,
  loadTokens,
};