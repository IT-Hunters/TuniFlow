const mongoose = require('mongoose');
const EmployeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }
}, { collection: 'employes' });

const Employe = mongoose.model('Employe', EmployeSchema);
module.exports = Employe;