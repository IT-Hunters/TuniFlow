const Bill = require('../model/Bill');
const User = require('../model/user');
const Wallet = require('../model/wallet');
const Project = require('../model/Project');
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.createInvoice = async (req, res) => {
  try {
    const { amount, due_date, category } = req.body;
    const creator_id = req.user.userId;

    const project = await Project.findOne({ businessManager: creator_id }).populate('businessOwner');
    if (!project) {
      return res.status(404).json({ message: "Aucun projet trouvé pour ce Business Manager" });
    }

    const recipient_id = project.businessOwner._id;

    const newInvoice = new Bill({
      creator_id,
      recipient_id,
      amount,
      due_date,
      category,
      status: "PENDING",
      project_id: project._id
    });
    await newInvoice.save();

    res.status(201).json({ message: "Facture créée avec succès", invoice: newInvoice });
  } catch (error) {
    console.error("Erreur création facture:", error);
    res.status(500).json({ message: "Erreur lors de la création de la facture", error });
  }
};

exports.sendInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Bill.findById(invoiceId)
      .populate("creator_id", "fullname email")
      .populate("recipient_id", "fullname email")
      .populate("project_id", "status");
    if (!invoice) return res.status(404).json({ message: "Facture non trouvée" });
    if (invoice.creator_id._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à envoyer cette facture" });
    }

    const pdfPath = await generateInvoicePDF(invoice);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: invoice.recipient_id.email,
      subject: `Facture de ${invoice.creator_id.fullname} (Projet: ${invoice.project_id.status})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Nouvelle Facture</h2>
          <p style="color: #555;">Bonjour <strong>${invoice.recipient_id.fullname}</strong>,</p>
          <p style="color: #555;">Vous avez reçu une nouvelle facture de <strong>${invoice.creator_id.fullname}</strong>. Voici les détails :</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Montant</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.amount} TND</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Date d'échéance</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.due_date.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Projet</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.project_id.status}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Catégorie</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.category || 'N/A'}</td>
            </tr>
          </table>
          <p style="color: #555;">Veuillez trouver le PDF de la facture en pièce jointe.</p>
          <p style="color: #555;">Cordialement,<br>TuniFlow Team</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:3000" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Voir mon tableau de bord</a>
          </div>
        </div>
      `,
      attachments: [{ filename: `invoice_${invoice._id}.pdf`, path: pdfPath }]
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Facture envoyée avec succès au Business Owner !" });
  } catch (error) {
    console.error("Erreur envoi facture:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de la facture" });
  }
};

exports.acceptInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.userId;

    const invoice = await Bill.findById(invoiceId)
      .populate("creator_id", "fullname email")
      .populate("recipient_id", "fullname email");
    if (!invoice) return res.status(404).json({ message: "Facture non trouvée" });
    if (invoice.recipient_id._id.toString() !== userId) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à accepter cette facture" });
    }
    if (invoice.status !== "PENDING") {
      return res.status(400).json({ message: "Cette facture ne peut plus être acceptée" });
    }

    invoice.status = "PAID";
    await invoice.save();

    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) return res.status(404).json({ message: "Portefeuille non trouvé" });
    if (wallet.balance < invoice.amount) {
      return res.status(400).json({ message: "Solde insuffisant" });
    }
    wallet.balance -= invoice.amount;
    await wallet.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: invoice.creator_id.email,
      subject: "Facture Acceptée",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #28a745; text-align: center;">Facture Acceptée</h2>
          <p style="color: #555;">Bonjour <strong>${invoice.creator_id.fullname}</strong>,</p>
          <p style="color: #555;">Votre facture de <strong>${invoice.amount} TND</strong> a été acceptée par <strong>${invoice.recipient_id.fullname}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Montant</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.amount} TND</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Date d'échéance</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.due_date.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Statut</td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #28a745;">PAID</td>
            </tr>
          </table>
          <p style="color: #555;">Merci pour votre collaboration.</p>
          <p style="color: #555;">Cordialement,<br>TuniFlow Team</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:3000" style="padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">Voir mon tableau de bord</a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Facture acceptée et solde mis à jour" });
  } catch (error) {
    console.error("Erreur acceptation facture:", error);
    res.status(500).json({ message: "Erreur lors de l'acceptation de la facture" });
  }
};

exports.getMyInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoices = await Bill.find({ recipient_id: userId })
      .populate("creator_id", "fullname email");
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Erreur récupération factures:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des factures" });
  }
};

exports.getBusinessOwners = async (req, res) => {
  try {
    const businessOwners = await User.find({ role: "BUSINESS_OWNER" }, "fullname lastname email");
    res.status(200).json(businessOwners);
  } catch (error) {
    console.error("Erreur récupération Business Owners:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des Business Owners" });
  }
};

const generateInvoicePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    const pdfPath = path.join(__dirname, `../invoices/invoice_${invoice._id}.pdf`);
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(20).text("Facture", { align: "center" });
    doc.fontSize(14).text(`ID: ${invoice._id}`);
    doc.text(`Créateur: ${invoice.creator_id.fullname}`);
    doc.text(`Destinataire: ${invoice.recipient_id.fullname}`);
    doc.text(`Montant: ${invoice.amount} TND`);
    doc.text(`Date d'échéance: ${invoice.due_date.toLocaleDateString()}`);
    doc.end();

    doc.on("finish", () => resolve(pdfPath));
    doc.on("error", reject);
  });
};