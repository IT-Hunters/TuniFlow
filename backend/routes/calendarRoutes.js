const express = require('express');
const { google } = require('googleapis');
const {
  oauth2Client,
  getAuthUrl,
  getAccessToken,
  loadTokens,
} = require('../config/googleAuth');

const router = express.Router();

// ✅ Route pour générer l'URL d'autorisation OAuth
router.get('/api/calendar/auth', (req, res) => {
  const authUrl = getAuthUrl();
  res.json({ authUrl });
});

// ✅ Route de redirection pour les appels depuis Google (ancienne version)
router.get('/api/calendar/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await getAccessToken(code);
    res.json({ message: 'Autorisation réussie', tokens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NOUVELLE ROUTE pour matcher : http://localhost:3000/callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await getAccessToken(code);
    res.send(`
      <h2>✅ Autorisation réussie !</h2>
      <p>Les jetons ont été générés et enregistrés. Vous pouvez fermer cette fenêtre.</p>
    `);
  } catch (error) {
    res.status(500).send(`
      <h2>❌ Erreur lors de l'authentification</h2>
      <p>${error.message}</p>
    `);
  }
});

// ✅ Route pour créer un événement Google Calendar
router.post('/api/calendar/create-event', async (req, res) => {
  try {
    loadTokens();

    if (!oauth2Client.credentials.access_token) {
      return res.status(401).json({
        error: 'Authentification requise. Veuillez autoriser via /api/calendar/auth.',
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { calendarId, event, sendNotifications } = req.body;

    const response = await calendar.events.insert({
      calendarId: calendarId || 'primary',
      resource: event,
      sendNotifications: sendNotifications || true,
    });

    res.status(200).json({
      message: 'Événement Google Calendar créé avec succès',
      event: response.data,
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de l\'événement',
      error: error.message,
    });
  }
});

module.exports = router;
