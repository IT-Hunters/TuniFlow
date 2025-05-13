const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Endpoint de prédiction
router.get('/predict/:projectId', async (req, res) => {
    const projectId = req.params.projectId;

    // Utilisation de path.join pour un chemin sûr
    const scriptPath = path.join(__dirname, '..', 'scripts', 'generate_enriched_transactions.py');
    const outputFile = path.join(__dirname, '..', 'public', 'predictions', `prediction_project_${projectId}.html`);

    // Utilisation d'un chemin universel avec python
    const command = `python "${scriptPath}" ${projectId}`;

    try {
        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Erreur lors de l'exécution : ${error.message}`);
                    reject(new Error("Erreur lors de la prédiction."));
                    return;
                }
                console.log(`✅ Script exécuté avec succès.\n${stdout}`);
                resolve();
            });
        });

        // Lire le fichier HTML généré
        const htmlContent = await fs.readFile(outputFile, 'utf-8');
        res.json({ html: htmlContent });
    } catch (error) {
        console.error('Error in prediction route:', error);
        res.status(500).json({ error: error.message || "Erreur lors de la prédiction." });
    }
});

module.exports = router;