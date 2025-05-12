const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const path = require('path');

// Endpoint de prédiction
router.get('/predict/:projectId', (req, res) => {
    const projectId = req.params.projectId;

    // Utilisation de path.join pour un chemin sûr
    const scriptPath = path.join(__dirname, '..', 'scripts', 'generate_enriched_transactions.py');

    // Utilisation d'un chemin universel avec python
    const command = `python "${scriptPath}" ${projectId}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Erreur lors de l'exécution : ${error.message}`);
            return res.status(500).json({ error: "Erreur lors de la prédiction." });
        }

        console.log(`✅ Script exécuté avec succès.\n${stdout}`);

        // Si ton script écrit bien un fichier ou renvoie en stdout
        // Ici on suppose une prédiction sous forme de fichier HTML déjà généré
        const url = `http://localhost:5000/predictions/prediction_project_${projectId}.html`;
        return res.json({ url });
    });
});

module.exports = router;
