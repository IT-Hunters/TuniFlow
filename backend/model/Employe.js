const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const EmployeSchema = new mongoose.Schema({
   
    name: { type: String, required: true },
    email: { type: String, required: true, },
    password: { type: String, required: true },
    role: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project" }
});

const Employe = mongoose.model('Employe', EmployeSchema);
module.exports = Employe;