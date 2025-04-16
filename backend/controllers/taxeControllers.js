const Taxes = require('../model/TaxeModels/Taxes');
const ObligationsFiscales = require('../model/TaxeModels/ObligationsFiscales');
const TranchesImposition = require('../model/TaxeModels/TranchesImposition');
exports.createTaxe = async (req, res) => {
    try {
        const taxe = new Taxes(req.body);
        await taxe.save();
        res.status(201).json(taxe);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTaxes = async (req, res) => {
    try {
        const taxes = await Taxes.find().populate('projet');
        res.status(200).json(taxes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTaxe = async (req, res) => {
    try {
        const taxe = await Taxes.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(taxe);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createObligationFiscale = async (req, res) => {
    try {
        const obligation = new ObligationsFiscales(req.body);
        await obligation.save();
        res.status(201).json(obligation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getObligationsFiscales = async (req, res) => {
    try {
        const obligations = await ObligationsFiscales.find().populate('projet');
        res.status(200).json(obligations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateObligationFiscale = async (req, res) => {
    try {
        const obligation = await ObligationsFiscales.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(obligation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createTrancheImposition = async (req, res) => {
    try {
        const tranche = new TranchesImposition(req.body);
        await tranche.save();
        res.status(201).json(tranche);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTranchesImposition = async (req, res) => {
    try {
        const tranches = await TranchesImposition.find().populate('taxe');
        res.status(200).json(tranches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTrancheImposition = async (req, res) => {
    try {
        const tranche = await TranchesImposition.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(tranche);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};