const Liability = require('../model/AssetPassif/Liability');
const Equity = require("../model/AssetPassif/Equity");
const CurrentLiabilities = require("../model/AssetPassif/CurrentLiabilities");
const NonCurrentLiabilities = require("../model/AssetPassif/NonCurrentLiabilities");


exports.getAllPassifs = async (req, res) => {
    try {
        const passifs = await Liability.find().sort({ timestamp: -1 , total_value: -1 });
        res.status(200).json(passifs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getPassifById = async (req, res) => {
    try {
        const passif = await Liability.findById(req.params.id);
        if (!passif) return res.status(404).json({ message: 'Liability not found' });
        res.status(200).json(passif);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.createPassif = async (req, res) => {
    try {
        let liability;

        switch (req.body.type_liability) {
            case "Equity":
                liability = new Equity(req.body);
                break;
            case "CurrentLiabilities":
                liability = new CurrentLiabilities(req.body);
                break;
            case "NonCurrentLiabilities":
                liability = new NonCurrentLiabilities(req.body);
                break;
            default:
                return res.status(400).json({ message: "Invalid liability type" });
        }

        await liability.save();
        res.status(201).json(liability);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.updatePassif = async (req, res) => {
    try {
        const updatedPassif = await Liability.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedPassif) return res.status(404).json({ message: 'Liability not found' });
        res.status(200).json(updatedPassif);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.deletePassif = async (req, res) => {
    try {
        const deletedPassif = await Liability.findByIdAndDelete(req.params.id);
        if (!deletedPassif) return res.status(404).json({ message: 'Liability not found' });

        res.status(200).json({ message: 'Liability deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
