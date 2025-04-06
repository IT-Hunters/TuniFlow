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
const multer = require('multer');

// Configurer Multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG files are allowed!"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadLogo = upload.single('logo');

// Configurer Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

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

    if (invoice.logoUrl) {
      const logoPath = path.join(__dirname, '../', invoice.logoUrl);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 100 });
      }
    }

    doc.moveDown(5);
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`ID: ${invoice._id}`);
    doc.text(`Creator: ${invoice.creator_id.fullname}`);
    doc.text(`Recipient: ${invoice.recipient_id.fullname}`);
    doc.text(`Amount: ${invoice.amount} TND`);
    doc.text(`Due Date: ${invoice.due_date.toLocaleDateString()}`);
    doc.text(`Category: ${invoice.category || "N/A"}`);

    if (invoice.customNotes) {
      doc.moveDown();
      doc.fontSize(12).text("Notes:", { underline: true });
      doc.text(invoice.customNotes);
    }

    doc.end();
  });
};

const sendReminderEmail = async (recipientEmail, bill) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `Reminder: Overdue Invoice #${bill.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: #e74c3c; text-align: center;">Overdue Invoice Reminder</h2>
        <p style="color: #555;">Hello <strong>${bill.recipient_id.fullname}</strong>,</p>
        <p style="color: #555;">This is a reminder that the following invoice is overdue:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Invoice ID</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bill.id}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Amount</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bill.amount} TND</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Due Date</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${new Date(bill.due_date).toLocaleDateString()}</td>
          </tr>
        </table>
        <p style="color: #555;">Please settle the payment as soon as possible to avoid further actions.</p>
        <p style="color: #555;">If you have already paid this invoice, please disregard this email.</p>
        <p style="color: #555;">Best regards,<br>The TuniFlow Team</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="http://localhost:3000" style="padding: 10px 20px; background-color: #e74c3c; color: #fff; text-decoration: none; border-radius: 5px;">View My Dashboard</a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder sent to ${recipientEmail} for invoice ${bill.id}`);
  } catch (error) {
    console.error(`Error sending reminder to ${recipientEmail}:`, error.message);
    throw error;
  }
};

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
        console.log(`No email found for recipient of bill ${bill.id}`);
        continue;
      }

      await sendReminderEmail(recipient.email, bill);

      bill.history.push({
        action: "REMINDER_SENT",
        date: new Date(),
        user: recipient._id
      });

      bill.reminderSent = true;
      bill.lastReminderDate = new Date();
      await bill.save();

      console.log(`Reminder sent for bill ${bill.id} to ${recipient.email}`);
    }
  } catch (error) {
    console.error("Error in sendOverdueReminders:", error.message);
  }
};

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
    const { amount, due_date, category, logoUrl, customNotes } = req.body;
    const creator_id = req.user.userId;

    console.log('Received data:', { amount, due_date, category, logoUrl, customNotes });
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
      logoUrl,
      customNotes,
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

    res.status(201).json({ message: "Invoice created successfully", invoice: newInvoice });
  } catch (error) {
    console.error("Error creating invoice:", error.message);
    res.status(500).json({ message: "Error creating invoice", error: error.message });
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
      subject: `Invoice from ${invoice.creator_id.fullname} (Project: ${invoice.project_id.status})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">New Invoice</h2>
          <p style="color: #555;">Hello <strong>${invoice.recipient_id.fullname}</strong>,</p>
          <p style="color: #555;">You have received a new invoice from <strong>${invoice.creator_id.fullname}</strong>. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Amount</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.amount} TND</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Due Date</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.due_date.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Project</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.project_id.status}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Category</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.category || "N/A"}</td>
            </tr>
          </table>
          ${invoice.customNotes ? `
            <p style="color: #555;"><strong>Custom Notes:</strong></p>
            <p style="color: #555;">${invoice.customNotes}</p>
          ` : ""}
          <p style="color: #555;">Scan the QR code below to accept and pay this invoice:</p>
          <img src="cid:qr_code" alt="QR Code" style="display: block; margin: 20px auto; width: 200px;"/>
          <p style="color: #555;">Please find the invoice PDF attached.</p>
          <p style="color: #555;">Best regards,<br>The TuniFlow Team</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:3000" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">View My Dashboard</a>
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

    invoice.history.push({
      action: "SENT",
      date: new Date(),
      user: req.user.userId
    });
    await invoice.save();

    res.status(200).json({ message: "Invoice sent successfully to the Business Owner with QR code!" });
  } catch (error) {
    console.error("Error sending invoice:", error.message);
    res.status(500).json({ message: "Error sending invoice", error: error.message });
  }
};

exports.acceptInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.userId;

    const invoice = await Bill.findById(invoiceId)
      .populate("creator_id", "fullname email")
      .populate("recipient_id", "fullname email");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.recipient_id._id.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to accept this invoice" });
    }
    
    if (invoice.status === "CANCELLED") {
      return res.status(400).json({ message: "This invoice can no longer be accepted as it is cancelled" });
    }
    if (invoice.status === "PAID") {
      return res.status(400).json({ message: "The invoice is already paid" });
    }

    invoice.status = "PAID";
    
    invoice.history.push({
      action: "PAID",
      date: new Date(),
      user: userId
    });

    await invoice.save();

    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (wallet.balance < invoice.amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    wallet.balance -= invoice.amount;
    await wallet.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: invoice.creator_id.email,
      subject: "Invoice Accepted",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #28a745; text-align: center;">Invoice Accepted</h2>
          <p style="color: #555;">Hello <strong>${invoice.creator_id.fullname}</strong>,</p>
          <p style="color: #555;">Your invoice of <strong>${invoice.amount} TND</strong> has been accepted by <strong>${invoice.recipient_id.fullname}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Amount</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.amount} TND</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Due Date</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${invoice.due_date.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background-color: #e9ecef; border: 1px solid #ddd;">Status</td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #28a745;">PAID</td>
            </tr>
          </table>
          <p style="color: #555;">Thank you for your collaboration.</p>
          <p style="color: #555;">Best regards,<br>The TuniFlow Team</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:3000" style="padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">View My Dashboard</a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Invoice accepted and balance updated" });
  } catch (error) {
    console.error("Error accepting invoice:", error);
    res.status(500).json({ message: "Error accepting invoice" });
  }
};

exports.getMyInvoices = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const invoices = await Bill.find({ recipient_id: userId })
      .populate("creator_id", "fullname lastname")
      .populate("project_id", "status")
      .populate("history.user", "fullname lastname");
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving invoices", error: error.message });
  }
};

exports.getBusinessOwners = async (req, res) => {
  try {
    const businessOwners = await User.find({ role: "BUSINESS_OWNER" }, "fullname lastname email");
    res.status(200).json(businessOwners);
  } catch (error) {
    console.error("Error retrieving Business Owners:", error.message);
    res.status(500).json({ message: "Error retrieving Business Owners", error: error.message });
  }
};

exports.getMySentInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoices = await Bill.find({ creator_id: userId })
      .populate("recipient_id", "fullname lastname")
      .populate("project_id", "status")
      .populate("history.user", "fullname lastname");
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving sent invoices", error: error.message });
  }
};

const getWeekNumber = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - startOfYear) / (1000 * 60 * 60 * 24);
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

exports.getInvoiceStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

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
      return res.status(403).json({ message: "Unauthorized role" });
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
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
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
        labels: Array.from({ length: 52 }, (_, i) => `Week ${i + 1}`),
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
    console.error("Error retrieving invoice statistics:", error.message);
    res.status(500).json({ message: "Error retrieving invoice statistics", error: error.message });
  }
};
exports.exportInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query; // Ajouter un paramètre de filtrage par statut

    // Construire la requête de recherche
    let query = { $or: [{ creator_id: userId }, { recipient_id: userId }] };
    if (status) {
      query.status = status; // Filtrer par statut si fourni
    }

    const invoices = await Bill.find(query)
      .populate('creator_id', 'fullname lastname')
      .populate('recipient_id', 'fullname lastname');

    // Préparer les en-têtes du CSV
    const csvData = [
      [
        'ID',
        'Amount',
        'Due Date',
        'Category',
        'Status',
        'Creator',
        'Recipient',
        'Custom Notes',
        'History'
      ],
      ...invoices.map(invoice => [
        invoice._id,
        invoice.amount,
        new Date(invoice.due_date).toISOString().split('T')[0],
        invoice.category || 'N/A',
        invoice.status,
        `${invoice.creator_id?.fullname || 'N/A'} ${invoice.creator_id?.lastname || ''}`,
        `${invoice.recipient_id?.fullname || 'N/A'} ${invoice.recipient_id?.lastname || ''}`,
        invoice.customNotes || 'N/A',
        invoice.history
          ? invoice.history
              .map(entry => `${entry.action} by ${entry.user?.fullname || 'Unknown'} on ${new Date(entry.date).toLocaleString()}`)
              .join('; ')
          : 'No history'
      ]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices_export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting invoices:", error.message);
    res.status(500).json({ message: 'Failed to export invoices', error: error.message });
  }
};