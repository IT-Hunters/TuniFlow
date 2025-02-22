const AssetPassif = require('../model/AssetPassif/Liability');

exports.getAllPassifs = async (req, res) => {
    try {
        const passifs = await AssetPassif.find();
        res.status(200).json(passifs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPassifById = async (req, res) => {
    try {
        const passif = await AssetPassif.findById(req.params.id);
        if (!passif) return res.status(404).json({ message: 'Passif not found' });
        res.status(200).json(passif);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPassif = async (req, res) => {
    try {
        const newPassif = new AssetPassif(req.body);
        await newPassif.save();
        res.status(201).json(newPassif);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updatePassif = async (req, res) => {
    try {
        const updatedPassif = await AssetPassif.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPassif) return res.status(404).json({ message: 'Passif not found' });
        res.status(200).json(updatedPassif);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePassif = async (req, res) => {
    try {
        const deletedPassif = await AssetPassif.findByIdAndDelete(req.params.id);
        if (!deletedPassif) return res.status(404).json({ message: 'Passif not found' });
        res.status(200).json({ message: 'Passif deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};