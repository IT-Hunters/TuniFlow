const mongoose = require("mongoose");
const Schema = mongoose.Schema; // Importer Schema
const User = require("./user"); // Importer le modèle User

// Définir le schéma BusinessOwner
const BusinessOwnerSchema = new Schema({
  companyName: { type: String },
  registrationNumber: { type: Number, },
  industry: { type: String,  },
  salary: { type: Number, },
  createdAt: { type: Date, default: Date.now },
  picture: { type: String },
  autorization: { type: Boolean, default: false },
  evidence: { type: String },
  projects: [{ type: Schema.Types.ObjectId, ref: "Project" }] ,// Utiliser Schema
  wallet: { type: Schema.Types.ObjectId, ref: "Wallet" }
});

// Ajouter une méthode au schéma
BusinessOwnerSchema.methods.acceptAutorisation = async function (accept) {
    this.autorization = accept;
    await this.save();
};

// Créer le modèle BusinessOwner à partir de User
const BusinessOwner = User.discriminator("BusinessOwner", BusinessOwnerSchema);

// Exporter le modèle
module.exports = BusinessOwner;