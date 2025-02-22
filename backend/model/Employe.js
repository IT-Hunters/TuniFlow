const mongoose = require('mongoose');
const EmployeSchema = new mongoose.Schema({
   
    name: { type: String, required: true },
    email: { type: String, required: true, },
    password: { type: String, required: true },
    role: { type: String, required: true }
});

const Employe = mongoose.model('Employe', EmployeSchema);
module.exports = Employe;