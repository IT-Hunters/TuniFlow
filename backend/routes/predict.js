const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Endpoint de prédiction
router.get('/predict/:projectId', async (req, res) => {
    const projectId = req.params.projectId;

    // Define paths
    const scriptPath = path.join(__dirname, '..', 'scripts', 'generate_enriched_transactions.py');
    const predictionsDir = path.join(__dirname, '..', 'public', 'predictions');
    const outputFile = path.join(predictionsDir, `prediction_project_${projectId}.html`);

    // Use environment variable for Python path, fallback to 'python' if not set
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const command = `"${pythonPath}" "${scriptPath}" "${projectId}" "${predictionsDir}"`;
    console.log(`Executing command: ${command}`); // Log the exact command for debugging

    try {
        // Execute the Python script
        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Erreur lors de l'exécution : ${error.message}`);
                    console.error(`STDERR: ${stderr}`);
                    console.error(`STDOUT: ${stdout}`);
                    reject(new Error(`Erreur lors de l'exécution du script Python : ${stderr || error.message}`));
                    return;
                }
                console.log(`✅ Script exécuté avec succès.\nSTDOUT: ${stdout}`);
                if (stderr) {
                    console.warn(`⚠️ STDERR: ${stderr}`);
                }
                resolve();
            });
        });

        // Read the generated HTML file
        const htmlContent = await fs.readFile(outputFile, 'utf-8');
        res.json({ html: htmlContent });
    } catch (error) {
        console.error('Error in prediction route:', error);
        res.status(500).json({ error: error.message || "Erreur lors de la prédiction." });
    }
});

module.exports = router;