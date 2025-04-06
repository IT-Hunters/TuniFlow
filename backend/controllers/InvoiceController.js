const Bill = require('../model/Bill');
const User = require('../model/user');
const Wallet = require('../model/wallet');
const Project = require('../model/Project');
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const QRCode = require("qrcode");
const cron = require("node-cron");

// Configurer Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Générer le PDF de la facture (inchangé)
const generateInvoicePDF = async (invoice) => {
  const pdfPath = path.join(__dirname, '../invoices', `invoice_${invoice._id}.pdf`);
  console.log('Attempting to generate PDF at:', pdfPath);

  const dir = path.join(__dirname, '../invoices');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Invoices directory created:', dir);
  }

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfPath);

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log('PDF generated successfully at:', pdfPath);
      resolve(pdfPath);
    });
    stream.on('error', (err) => {
      console.error('Error writing PDF:', err);
      reject(err);
    });

    doc.pipe(stream);
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.text(`ID: ${invoice._id}`);
    doc.text(`Creator: ${invoice.creator_id.fullname}`);
    doc.text(`Recipient: ${invoice.recipient_id.fullname}`);
    doc.text(`Amount: ${invoice.amount} TND`);
    doc.text(`Due Date: ${invoice.due_date.toLocaleDateString()}`);
    doc.end();
  });
};

// Fonction pour envoyer un email de rappel
const sendReminderEmail = async (recipientEmail, bill) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `Rappel : Facture en retard #${bill.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: #e74c3c; text-align: center;">Rappel de facture en retard</h2>
        <p style="color: #555;">Bonjour <strong>${bill.recipient_id.fullname}</strong>,</p>
        <p style="color: #555;">Nous vous rappelons que la facture suivante est en retard de paiement :</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">ID de la facture</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bill.id}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Montant</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bill.amount} TND</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Date d'échéance</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${new Date(bill.due_date).toLocaleDateString('fr-FR')}</td>
          </tr>
        </table>
        <p style="color: #555;">Veuillez régler le paiement dès que possible afin d'éviter d'autres actions.</p>
        <p style="color: #555;">Si vous avez déjà payé cette facture, veuillez ignorer cet email.</p>
        <p style="color: #555;">Cordialement,<br>L'équipe TuniFlow</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="http://localhost:3000" style="padding: 10px 20px; background-color: #e74c3c; color: #fff; text-decoration: none; border-radius: 5px;">Voir mon tableau de bord</a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Rappel envoyé à ${recipientEmail} pour la facture ${bill.id}`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi du rappel à ${recipientEmail}:`, error.message);
    throw error;
  }
};

// Fonction pour vérifier les factures en retard et envoyer des rappels
const sendOverdueReminders = async () => {
  try {
    const today = new Date();
    const overdueBills = await Bill.find({
      status: "PENDING",
      due_date: { $lt: today },
      reminderSent: false,
    }).populate("recipient_id");

    console.log(`Found ${overdueBills.length} overdue bills to process.`);

    for (const bill of overdueBills) {
      const recipient = bill.recipient_id;
      if (!recipient || !recipient.email) {
        console.log(`Aucun email trouvé pour le destinataire de la facture ${bill.id}`);
        continue;
      }

      // Envoyer l'email de rappel
      await sendReminderEmail(recipient.email, bill);

      // Ajouter une entrée dans l'historique
      bill.history.push({
        action: "REMINDER_SENT",
        date: new Date(),
        user: recipient._id // On peut utiliser l'ID du destinataire ou un ID système si nécessaire
      });

      // Mettre à jour la facture pour indiquer que le rappel a été envoyé
      bill.reminderSent = true;
      bill.lastReminderDate = new Date();
      await bill.save();

      console.log(`Rappel envoyé pour la facture ${bill.id} à ${recipient.email}`);
    }
  } catch (error) {
    console.error("Erreur dans sendOverdueReminders:", error.message);
  }
};

// Fonction pour initialiser la tâche cron
const initializeReminderJob = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("Running overdue invoice reminder job at", new Date().toISOString());
    await sendOverdueReminders();
  });
  console.log("Reminder job scheduled to run daily at 9:00 AM");
};

initializeReminderJob();

exports.createInvoice = async (req, res) => {
  try {
    const { amount, due_date, category } = req.body;
    const creator_id = req.user.userId;

    console.log('Received data:', { amount, due_date, category });
    console.log('Creator ID:', creator_id);

    const project = await Project.findOne({ businessManager: creator_id }).populate('businessOwner');
    console.log('Project found:', project);
    if (!project) {
      return res.status(404).json({ message: "No project found for this Business Manager" });
    }
    if (!project.businessOwner) {
      return res.status(400).json({ message: "No Business Owner assigned to this project" });
    }

    const recipient_id = project.businessOwner._id;
    console.log('Recipient ID:', recipient_id);

    const newInvoice = new Bill({
      id: uuidv4(),
      creator_id,
      recipient_id,
      amount: Number(amount),
      due_date,
      category,
      status: "PENDING",
      project_id: project._id,
      history: [
        {
          action: "CREATED",
          date: new Date(),
          user: creator_id
        }
      ]
    });
    console.log('New invoice before saving:', newInvoice);

    await newInvoice.save();
    console.log('Invoice saved successfully');

    res.status(201).json({ message: "Facture créée avec succès", invoice: newInvoice });
  } catch (error) {
    console.error("Erreur lors de la création de la facture:", error.message);
    res.status(500).json({ message: "Erreur lors de la création de la facture", error: error.message });
  }
};

exports.sendInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Bill.findById(invoiceId)
      .populate("creator_id", "fullname email")
      .populate("recipient_id", "fullname email")
      .populate("project_id", "status");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.creator_id._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You are not authorized to send this invoice" });
    }

    const pdfPath = await generateInvoicePDF(invoice);
    if (!fs.existsSync(pdfPath)) {
      console.error("PDF file not found:", pdfPath);
      return res.status(500).json({ message: "Error: PDF file was not generated correctly" });
    }
    console.log("PDF file found:", pdfPath);

    const qrCodeData = `http://localhost:3000/invoices/${invoiceId}/accept`;
    const qrCodePath = path.join(__dirname, "../invoices", `qr_${invoiceId}.png`);
    await QRCode.toFile(qrCodePath, qrCodeData, {
      errorCorrectionLevel: "H",
      width: 200,
    });
    if (!fs.existsSync(qrCodePath)) {
      console.error("QR code file not found:", qrCodePath);
      return res.status(500).json({ message: "Error: QR code was not generated correctly" });
    }
    console.log("QR code generated at:", qrCodePath);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: invoice.recipient_id.email,
      subject: `Facture de ${invoice.creator_id.fullname} (Projet: ${invoice.project_id.status})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Nouvelle facture</h2>
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
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.category || "N/A"}</td>
            </tr>
          </table>
          <p style="color: #555;">Scannez le QR code ci-dessous pour accepter et payer cette facture :</p>
          <img src="cid:qr_code" alt="QR Code" style="display: block; margin: 20px auto; width: 200px;"/>
          <p style="color: #555;">Veuillez trouver la facture en PDF en pièce jointe.</p>
          <p style="color: #555;">Cordialement,<br>L'équipe TuniFlow</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:3000" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Voir mon tableau de bord</a>
          </div>
        </div>
      `,
      attachments: [
        { filename: `invoice_${invoice._id}.pdf`, path: pdfPath },
        { filename: `qr_${invoice._id}.png`, path: qrCodePath, cid: "qr_code" }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log("Email successfully sent to:", invoice.recipient_id.email);

    // Ajouter une entrée dans l'historique
    invoice.history.push({
      action: "SENT",
      date: new Date(),
      user: req.user.userId
    });
    await invoice.save();

    res.status(200).json({ message: "Facture envoyée avec succès au Business Owner avec QR code !" });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la facture:", error.message);
    res.status(500).json({ message: "Erreur lors de l'envoi de la facture", error: error.message });
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
    
    if (invoice.status === "CANCELLED") {
      return res.status(400).json({ message: "Cette facture ne peut plus être acceptée car elle est annulée" });
    }
    if (invoice.status === "PAID") {
      return res.status(400).json({ message: "La facture est déjà payée" });
    }

    invoice.status = "PAID";
    
    // Ajouter une entrée dans l'historique
    invoice.history.push({
      action: "PAID",
      date: new Date(),
      user: userId
    });

    await invoice.save();

    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) return res.status(404).json({ message: "Portefeuille non trouvé" });
    if (wallet.balance < invoice.amount) {
      return res.status(400).json({ message: "Solde insuffisant" });
    }
    wallet.balance -= invoice.amount;
    await wallet.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: invoice.creator_id.email,
      subject: "Facture acceptée",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #28a745; text-align: center;">Facture acceptée</h2>
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
              <td style="padding: 10px; border: 1px solid #ddd; color: #28a745;">PAYÉ</td>
            </tr>
          </table>
          <p style="color: #555;">Merci pour votre collaboration.</p>
          <p style="color: #555;">Cordialement,<br>L'équipe TuniFlow</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:3000" style="padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">Voir mon tableau de bord</a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Facture acceptée et solde mis à jour" });
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la facture:", error);
    res.status(500).json({ message: "Erreur lors de l'acceptation de la facture" });
  }
};

exports.getMyInvoices = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const invoices = await Bill.find({ recipient_id: userId })
      .populate("creator_id", "fullname lastname")
      .populate("project_id", "status")
      .populate("history.user", "fullname lastname"); // Populer l'utilisateur dans l'historique
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des factures", error: error.message });
  }
};

exports.getBusinessOwners = async (req, res) => {
  try {
    const businessOwners = await User.find({ role: "BUSINESS_OWNER" }, "fullname lastname email");
    res.status(200).json(businessOwners);
  } catch (error) {
    console.error("Erreur lors de la récupération des Business Owners:", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des Business Owners", error: error.message });
  }
};

exports.getMySentInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoices = await Bill.find({ creator_id: userId })
      .populate("recipient_id", "fullname lastname")
      .populate("project_id", "status")
      .populate("history.user", "fullname lastname"); // Populer l'utilisateur dans l'historique
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des factures envoyées", error: error.message });
  }
};

// Fonction pour calculer le numéro de la semaine (inchangé)
const getWeekNumber = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - startOfYear) / (1000 * 60 * 60 * 24);
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

exports.getInvoiceStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const period = req.query.period || "month";
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    let invoices;
    if (user.role === "BUSINESS_MANAGER") {
      invoices = await Bill.find({ creator_id: userId })
        .populate("recipient_id", "fullname lastname")
        .populate("project_id", "status");
    } else if (user.role === "BUSINESS_OWNER") {
      invoices = await Bill.find({ recipient_id: userId })
        .populate("creator_id", "fullname lastname")
        .populate("project_id", "status");
    } else {
      return res.status(403).json({ message: "Rôle non autorisé" });
    }

    console.log("User ID:", userId);
    console.log("User Role:", user.role);
    console.log("Invoices found:", invoices.map(invoice => ({
      id: invoice._id,
      due_date: invoice.due_date,
      amount: invoice.amount,
      creator_id: invoice.creator_id,
      recipient_id: invoice.recipient_id,
    })));

    const totalPaid = invoices
      .filter(invoice => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const totalPending = invoices
      .filter(invoice => invoice.status === "PENDING")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const today = new Date();
    const totalOverdue = invoices
      .filter(invoice => invoice.status === "PENDING" && new Date(invoice.due_date) < today)
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const overdueInvoices = invoices
      .filter(invoice => invoice.status === "PENDING" && new Date(invoice.due_date) < today)
      .map(invoice => ({
        id: invoice._id,
        amount: invoice.amount,
        due_date: invoice.due_date,
        category: invoice.category,
        recipient: user.role === "BUSINESS_MANAGER" ? `${invoice.recipient_id.fullname} ${invoice.recipient_id.lastname}` : null,
        creator: user.role === "BUSINESS_OWNER" ? `${invoice.creator_id.fullname} ${invoice.creator_id.lastname}` : null,
      }));

    let chartData = {};
    if (period === "month") {
      const monthlyData = Array(12).fill(0);
      invoices.forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        console.log(`Invoice ${invoice._id}: due_date=${invoice.due_date}, year=${dueDate.getFullYear()}, month=${dueDate.getMonth()}`);
        if (dueDate.getFullYear() === year) {
          const month = dueDate.getMonth();
          monthlyData[month] += invoice.amount;
        }
      });
      chartData = {
        labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
        data: monthlyData,
      };
    } else if (period === "year") {
      const years = [...new Set(invoices.map(invoice => new Date(invoice.due_date).getFullYear()))].sort();
      const yearlyData = years.map(year => {
        return invoices
          .filter(invoice => new Date(invoice.due_date).getFullYear() === year)
          .reduce((sum, invoice) => sum + invoice.amount, 0);
      });
      chartData = {
        labels: years,
        data: yearlyData,
      };
    } else if (period === "week") {
      const weeklyData = Array(52).fill(0);
      invoices.forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        if (dueDate.getFullYear() === year) {
          const week = getWeekNumber(dueDate);
          console.log(`Invoice ${invoice._id}: due_date=${invoice.due_date}, week=${week}`);
          if (week >= 1 && week <= 52) {
            weeklyData[week - 1] += invoice.amount;
          }
        }
      });
      chartData = {
        labels: Array.from({ length: 52 }, (_, i) => `Semaine ${i + 1}`),
        data: weeklyData,
      };
    }

    console.log("Chart Data:", chartData);

    const availableYears = [...new Set(invoices.map(invoice => new Date(invoice.due_date).getFullYear()))].sort();
    console.log("Available Years:", availableYears);

    res.status(200).json({
      totalPaid,
      totalPending,
      totalOverdue,
      chartData,
      overdueInvoices,
      availableYears: availableYears.length > 0 ? availableYears : [new Date().getFullYear()],
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques des factures:", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques des factures", error: error.message });
  }
};