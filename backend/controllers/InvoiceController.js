const path = require("path");
const fs = require("fs"); // Import standard fs
const fsPromises = require("fs").promises; // Import promises separately
const { PythonShell } = require("python-shell");
const Bill = require("../model/Bill");
const User = require("../model/user");
const Wallet = require("../model/wallet");
const Project = require("../model/Project");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const cron = require("node-cron");
const multer = require("multer");
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');

// Configurer Multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, "../uploads/logos");
      if (!fs.existsSync(uploadDir)) {
        await fsPromises.mkdir(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.uploadLogo = upload.single("logo");

// Configurer Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const generateDescription = (amount, category, project) => {
  const templates = require(path.join(__dirname, "../data/invoice-descriptions.json")).templates;
  const categoryTemplates = templates[category || "N/A"];
  const threshold = Object.keys(categoryTemplates).find((t) => {
    if (t.startsWith("<")) return amount < parseInt(t.slice(1));
    if (t.startsWith(">=")) return amount >= parseInt(t.slice(2));
    return false;
  }) || ">=1500"; // Par défaut pour les montants élevés
  let description = categoryTemplates[threshold];
  description = description
    .replace("{amount}", amount)
    .replace("{project}", project?.status || "N/A");
  return description;
};

exports.generateDescription = async (req, res) => {
  const { amount, category, project } = req.body;
  const description = generateDescription(Number(amount), category, project);
  res.status(200).json({ description });
};

exports.predictPaymentLikelihood = async (req, res) => {
  try {
    const { amount, due_date, category, project_status } = req.body;

    const days_to_due = Math.max(
      0,
      Math.ceil((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24))
    );

    const inputData = {
      amount: Number(amount),
      days_to_due,
      category: category || "N/A",
      project_status: project_status || "N/A",
    };

    const options = {
      mode: "text",
      pythonPath: 'python',  // Use system Python path
      pythonOptions: ["-u"],
      scriptPath: path.join(__dirname, "../ml"),
      args: [JSON.stringify(inputData)],
    };

    PythonShell.run("predict_payment.py", options, (err, results) => {
      if (err) {
          console.error("Erreur lors de la prédiction:", err);
          return res.status(500).json({ message: "Erreur lors de la prédiction", error: err.message });
      }
  
      const predictionResult = JSON.parse(results[0]);
      console.log("Prediction result sent to frontend:", predictionResult);  // Debugging line
      res.status(200).json(predictionResult);
  });
  
  } catch (error) {
    console.error("Erreur dans predictPaymentLikelihood:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const generateInvoicePDF = async (invoice) => {
  const pdfPath = path.join(__dirname, "../invoices", `invoice_${invoice._id}.pdf`);
  console.log("Attempting to generate PDF at:", pdfPath);

  const dir = path.join(__dirname, "../invoices");
  if (!fs.existsSync(dir)) {
    await fsPromises.mkdir(dir, { recursive: true });
    console.log("Invoices directory created:", dir);
  }

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfPath);

  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      console.log("PDF generated successfully at:", pdfPath);
      resolve(pdfPath);
    });
    stream.on("error", (err) => {
      console.error("Error writing PDF:", err);
      reject(err);
    });

    doc.pipe(stream);

    if (invoice.logoUrl) {
      const logoPath = path.join(__dirname, "../", invoice.logoUrl);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 100 });
      }
    }

    doc.moveDown(5);
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`ID: ${invoice._id}`)
      .text(`Creator: ${invoice.creator_id.fullname}`)
      .text(`Recipient: ${invoice.recipient_id.fullname}`)
      .text(`Amount: ${invoice.amount} TND`)
      .text(`Due Date: ${invoice.due_date.toLocaleDateString()}`)
      .text(`Category: ${invoice.category || "N/A"}`);

    if (invoice.customNotes) {
      doc.moveDown();
      doc.fontSize(12).text("Notes:", { underline: true });
      doc.text(invoice.customNotes);
    }

    doc.end();
  });
};

const sendReminderEmail = async (recipientEmail, bill, reminderType) => {
  const isOverdue = reminderType === "OVERDUE";
  const subject = isOverdue
    ? `Reminder: Overdue Invoice #${bill.id}`
    : `Upcoming Invoice Reminder: Due on ${new Date(bill.due_date).toLocaleDateString()}`;
  const title = isOverdue
    ? "Overdue Invoice Reminder"
    : "Upcoming Invoice Reminder";
  const message = isOverdue
    ? "This is a reminder that the following invoice is overdue:"
    : `This is a reminder that the following invoice is due on ${new Date(bill.due_date).toLocaleDateString()}:`;
  const urgencyColor = isOverdue ? "#e74c3c" : "#f39c12";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: ${urgencyColor}; text-align: center;">${title}</h2>
        <p style="color: #555;">Hello <strong>${bill.recipient_id.fullname}</strong>,</p>
        <p style="color: #555;">${message}</p>
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
        <p style="color: #555;">Please settle the payment as soon as possible${isOverdue ? " to avoid further actions" : ""}.</p>
        <p style="color: #555;">If you have already paid this invoice, please disregard this email.</p>
        <p style="color: #555;">Best regards,<br>The TuniFlow Team</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="http://localhost:3000" style="padding: 10px 20px; background-color: ${urgencyColor}; color: #fff; text-decoration: none; border-radius: 5px;">View My Dashboard</a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`${reminderType} reminder sent to ${recipientEmail} for invoice ${bill.id}`);
  } catch (error) {
    console.error(`Error sending ${reminderType} reminder to ${recipientEmail}:`, error.message);
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

      await sendReminderEmail(recipient.email, bill, "OVERDUE");

      bill.history.push({
        action: "REMINDER_SENT",
        date: new Date(),
        user: recipient._id,
      });

      bill.reminderSent = true;
      bill.lastReminderDate = new Date();
      await bill.save();

      console.log(`Overdue reminder sent for bill ${bill.id} to ${recipient.email}`);
    }
  } catch (error) {
    console.error("Error in sendOverdueReminders:", error.message);
  }
};

const sendUpcomingReminders = async () => {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const upcomingBills = await Bill.find({
      status: "PENDING",
      due_date: { $gte: today, $lte: threeDaysFromNow },
      reminderSent: false,
    })
      .populate("recipient_id")
      .sort({ amount: -1 });

    console.log(`Found ${upcomingBills.length} upcoming bills to process.`);

    for (const bill of upcomingBills) {
      const recipient = bill.recipient_id;
      if (!recipient || !recipient.email) {
        console.log(`No email found for recipient of bill ${bill.id}`);
        continue;
      }

      const isHighAmount = bill.amount > 500;
      const isLastDay =
        new Date(bill.due_date).toDateString() === threeDaysFromNow.toDateString();
      if (isHighAmount || isLastDay) {
        await sendReminderEmail(recipient.email, bill, "UPCOMING");

        bill.history.push({
          action: "UPCOMING_REMINDER_SENT",
          date: new Date(),
          user: recipient._id,
        });

        bill.reminderSent = true;
        bill.lastReminderDate = new Date();
        await bill.save();

        console.log(`Upcoming reminder sent for bill ${bill.id} to ${recipient.email}`);
      }
    }
  } catch (error) {
    console.error("Error in sendUpcomingReminders:", error.message);
  }
};

const initializeReminderJob = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("Running overdue invoice reminder job at", new Date().toISOString());
    await sendOverdueReminders();
  });

  cron.schedule("0 10 * * *", async () => {
    console.log("Running upcoming invoice reminder job at", new Date().toISOString());
    await sendUpcomingReminders();
  });

  console.log("Reminder jobs scheduled: Overdue at 9:00 AM, Upcoming at 10:00 AM");
};

initializeReminderJob();

exports.createInvoice = async (req, res) => {
  try {
    const { amount, due_date, category, logoUrl, customNotes } = req.body;
    const creator_id = req.user.userId;

    console.log("Received data:", { amount, due_date, category, logoUrl, customNotes });
    console.log("Creator ID:", creator_id);

    const project = await Project.findOne({ businessManager: creator_id }).populate("businessOwner");
    console.log("Project found:", project);
    if (!project) {
      return res.status(404).json({ message: "No project found for this Business Manager" });
    }
    if (!project.businessOwner) {
      return res.status(400).json({ message: "No Business Owner assigned to this project" });
    }

    const recipient_id = project.businessOwner._id;
    console.log("Recipient ID:", recipient_id);

    // Générer une description si customNotes est vide ou non fourni
    const generatedDescription = customNotes
      ? customNotes
      : generateDescription(Number(amount), category, project);

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
      customNotes: generatedDescription,
      history: [
        {
          action: "CREATED",
          date: new Date(),
          user: creator_id,
        },
      ],
    });
    console.log("New invoice before saving:", newInvoice);

    await newInvoice.save();
    console.log("Invoice saved successfully");

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
          ${
            invoice.customNotes
              ? `
            <p style="color: #555;"><strong>Custom Notes:</strong></p>
            <p style="color: #555;">${invoice.customNotes}</p>
          `
              : ""
          }
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
        { filename: `qr_${invoiceId}.png`, path: qrCodePath, cid: "qr_code" },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Email successfully sent to:", invoice.recipient_id.email);

    invoice.history.push({
      action: "SENT",
      date: new Date(),
      user: req.user.userId,
    });
    await invoice.save();

    res
      .status(200)
      .json({ message: "Invoice sent successfully to the Business Owner with QR code!" });
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
      return res
        .status(400)
        .json({ message: "This invoice can no longer be accepted as it is cancelled" });
    }
    if (invoice.status === "PAID") {
      return res.status(400).json({ message: "The invoice is already paid" });
    }

    invoice.status = "PAID";

    invoice.history.push({
      action: "PAID",
      date: new Date(),
      user: userId,
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
      `,
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
    const businessOwners = await User.find(
      { role: "BUSINESS_OWNER" },
      "fullname lastname email"
    );
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
    console.log(
      "Invoices found:",
      invoices.map((invoice) => ({
        id: invoice._id,
        due_date: invoice.due_date,
        amount: invoice.amount,
        creator_id: invoice.creator_id,
        recipient_id: invoice.recipient_id,
      }))
    );

    const totalPaid = invoices
      .filter((invoice) => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const totalPending = invoices
      .filter((invoice) => invoice.status === "PENDING")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const today = new Date();
    const totalOverdue = invoices
      .filter(
        (invoice) => invoice.status === "PENDING" && new Date(invoice.due_date) < today
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const overdueInvoices = invoices
      .filter(
        (invoice) => invoice.status === "PENDING" && new Date(invoice.due_date) < today
      )
      .map((invoice) => ({
        id: invoice._id,
        amount: invoice.amount,
        due_date: invoice.due_date,
        category: invoice.category,
        recipient:
          user.role === "BUSINESS_MANAGER"
            ? `${invoice.recipient_id.fullname} ${invoice.recipient_id.lastname}`
            : null,
        creator:
          user.role === "BUSINESS_OWNER"
            ? `${invoice.creator_id.fullname} ${invoice.creator_id.lastname}`
            : null,
      }));

    let chartData = {};
    if (period === "month") {
      const monthlyData = Array(12).fill(0);
      invoices.forEach((invoice) => {
        const dueDate = new Date(invoice.due_date);
        console.log(
          `Invoice ${invoice._id}: due_date=${invoice.due_date}, year=${dueDate.getFullYear()}, month=${dueDate.getMonth()}`
        );
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
      const years = [...new Set(invoices.map((invoice) => new Date(invoice.due_date).getFullYear()))].sort();
      const yearlyData = years.map((year) => {
        return invoices
          .filter((invoice) => new Date(invoice.due_date).getFullYear() === year)
          .reduce((sum, invoice) => sum + invoice.amount, 0);
      });
      chartData = {
        labels: years,
        data: yearlyData,
      };
    } else if (period === "week") {
      const weeklyData = Array(52).fill(0);
      invoices.forEach((invoice) => {
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

    const availableYears = [...new Set(invoices.map((invoice) => new Date(invoice.due_date).getFullYear()))].sort();
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
    const { status } = req.query;

    let query = { $or: [{ creator_id: userId }, { recipient_id: userId }] };
    if (status) {
      query.status = status;
    }

    const invoices = await Bill.find(query)
      .populate("creator_id", "fullname lastname")
      .populate("recipient_id", "fullname lastname")
      .populate("project_id", "status");

    const csvData = [
      [
        "ID",
        "Amount",
        "Due Date",
        "Category",
        "Status",
        "Creator",
        "Recipient",
        "Custom Notes",
        "History",
        "created_at",
        "project_status",
      ],
      ...invoices.map((invoice) => [
        invoice._id,
        invoice.amount,
        new Date(invoice.due_date).toISOString().split("T")[0],
        invoice.category || "N/A",
        invoice.status,
        `${invoice.creator_id?.fullname || "N/A"} ${invoice.creator_id?.lastname || ""}`,
        `${invoice.recipient_id?.fullname || "N/A"} ${invoice.recipient_id?.lastname || ""}`,
        invoice.customNotes || "N/A",
        invoice.history
          ? invoice.history
              .map(
                (entry) =>
                  `${entry.action} by ${entry.user?.fullname || "Unknown"} on ${new Date(
                    entry.date
                  ).toLocaleString()}`
              )
              .join("; ")
          : "No history",
        invoice.created_at.toISOString().split("T")[0],
        invoice.project_id?.status || "N/A",
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="invoices_export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting invoices:", error.message);
    res.status(500).json({ message: "Failed to export invoices", error: error.message });
  }
};

exports.testUpcomingReminders = async (req, res) => {
  try {
    await sendUpcomingReminders();
    res.status(200).json({ message: "Upcoming reminders sent successfully" });
  } catch (error) {
    console.error("Error testing upcoming reminders:", error.message);
    res.status(500).json({ message: "Error testing upcoming reminders", error: error.message });
  }
};

exports.batchPredictPaymentLikelihood = async (req, res) => {
  try {
    console.log("Starting batchPredictPaymentLikelihood");
    
    const invoices = req.body.invoices;
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ 
        message: "Invalid input: invoices must be a non-empty array",
        received: invoices 
      });
    }

    const inputData = invoices.map(invoice => ({
      amount: Number(invoice.amount) || 0,
      days_to_due: Math.max(
        0,
        Math.ceil((new Date(invoice.due_date) - new Date()) / (1000 * 60 * 60 * 24))
      ),
      category: String(invoice.category || "N/A"),
      project_status: String(invoice.project_id?.status || "N/A")
    }));

    // Utiliser child_process au lieu de python-shell
    const { spawn } = require('child_process');
    const pythonPath = 'python';  // Use system Python directly
    const scriptPath = path.join(__dirname, "../ml/predict_payment_batch.py");

    console.log('Executing Python script with:', {
      pythonPath,
      scriptPath,
      inputData: JSON.stringify(inputData)
    });

    const pythonProcess = spawn(pythonPath, [scriptPath]);
    let dataString = '';
    let errorString = '';

    // Envoyer les données au script Python
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    // Collecter la sortie
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error('Python stderr:', data.toString());
    });

    // Gérer la fin du processus
    const processResult = await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (code !== 0) {
          reject(new Error(`Python process failed with code ${code}\nError: ${errorString}`));
        } else {
          resolve(dataString);
        }
      });

      // Ajouter un timeout de 30 secondes
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script execution timed out after 30 seconds'));
      }, 30000);
    });

    // Traiter les résultats
    if (!processResult) {
      throw new Error("No prediction results received from Python script");
    }

    const predictions = JSON.parse(processResult);
    
    if (!Array.isArray(predictions) || predictions.length !== invoices.length) {
      throw new Error("Invalid prediction results format");
    }

    const response = invoices.map((invoice, index) => ({
      invoice_id: invoice._id || invoice.id,
      prediction: predictions[index]
    }));

    return res.status(200).json({
      success: true,
      predictions: response
    });

  } catch (error) {
    console.error("Error in batchPredictPaymentLikelihood:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to predict payment likelihood",
      error: error.message,
      details: error.stack
    });
  }
};

exports.generateInvoiceSummary = async (req, res) => {
  try {
    const { period, year, month } = req.query;
    const userId = req.user.userId;

    // Déterminer la plage de dates en fonction de la période
    const startDate = new Date();
    const endDate = new Date();

    if (period === 'monthly') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
      
      startDate.setFullYear(targetYear, targetMonth, 1);
      endDate.setFullYear(targetYear, targetMonth + 1, 0);
    } else if (period === 'quarterly') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const currentQuarter = Math.floor((month ? parseInt(month) - 1 : new Date().getMonth()) / 3);
      
      startDate.setFullYear(targetYear, currentQuarter * 3, 1);
      endDate.setFullYear(targetYear, (currentQuarter + 1) * 3, 0);
    } else if (period === 'yearly') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      
      startDate.setFullYear(targetYear, 0, 1);
      endDate.setFullYear(targetYear, 11, 31);
    } else {
      return res.status(400).json({ message: "Période invalide. Utilisez 'monthly', 'quarterly', ou 'yearly'." });
    }

    // Trouver toutes les factures de l'utilisateur dans la période donnée
    const sentInvoices = await Bill.find({
      creator_id: userId,
      created_at: { $gte: startDate, $lte: endDate }
    }).populate("recipient_id", "fullname").populate("project_id", "status");

    const receivedInvoices = await Bill.find({
      recipient_id: userId,
      created_at: { $gte: startDate, $lte: endDate }
    }).populate("creator_id", "fullname").populate("project_id", "status");

    // Calculer les statistiques
    const totalSent = sentInvoices.length;
    const totalReceived = receivedInvoices.length;
    
    const totalAmountSent = sentInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalAmountReceived = receivedInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    
    const paidSent = sentInvoices.filter(inv => inv.status === "PAID").length;
    const paidReceived = receivedInvoices.filter(inv => inv.status === "PAID").length;
    
    const pendingSent = sentInvoices.filter(inv => inv.status === "PENDING").length;
    const pendingReceived = receivedInvoices.filter(inv => inv.status === "PENDING").length;

    // Répartition par catégorie
    const categoriesSent = {};
    sentInvoices.forEach(invoice => {
      const category = invoice.category || "Non catégorisé";
      if (!categoriesSent[category]) categoriesSent[category] = { count: 0, amount: 0 };
      categoriesSent[category].count++;
      categoriesSent[category].amount += invoice.amount;
    });

    // Récupérer les 5 factures les plus importantes
    const topInvoices = [...sentInvoices, ...receivedInvoices]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(invoice => ({
        id: invoice._id,
        amount: invoice.amount,
        status: invoice.status,
        due_date: invoice.due_date,
        type: invoice.creator_id._id.toString() === userId ? "Envoyée" : "Reçue",
        party: invoice.creator_id._id.toString() === userId 
          ? invoice.recipient_id.fullname 
          : invoice.creator_id.fullname
      }));

    // Générer un résumé textuel
    const periodText = period === 'monthly' ? 'mensuel' : (period === 'quarterly' ? 'trimestriel' : 'annuel');
    const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    
    const summary = {
      title: `Résumé ${periodText} de factures (${dateRange})`,
      overview: `Durant cette période, vous avez ${totalSent > 0 ? `envoyé ${totalSent} facture(s) d'un montant total de ${totalAmountSent} TND` : "n'avez envoyé aucune facture"} et ${totalReceived > 0 ? `reçu ${totalReceived} facture(s) d'un montant total de ${totalAmountReceived} TND` : "n'avez reçu aucune facture"}.`,
      sentInvoices: {
        total: totalSent,
        paid: paidSent,
        pending: pendingSent,
        totalAmount: totalAmountSent,
        categories: categoriesSent
      },
      receivedInvoices: {
        total: totalReceived,
        paid: paidReceived,
        pending: pendingReceived,
        totalAmount: totalAmountReceived
      },
      topInvoices: topInvoices,
      conclusions: []
    };

    // Ajouter des conclusions et recommandations intelligentes basées sur les données
    if (pendingSent > 0) {
      summary.conclusions.push(`Vous avez ${pendingSent} facture(s) envoyée(s) en attente de paiement. Envisagez d'envoyer des rappels pour accélérer les paiements.`);
    }
    
    if (pendingReceived > 0) {
      summary.conclusions.push(`Vous avez ${pendingReceived} facture(s) reçue(s) en attente de paiement. Planifiez vos paiements pour respecter les délais.`);
    }

    // Analyser les tendances de dépenses par catégorie
    if (Object.keys(categoriesSent).length > 0) {
      const topCategory = Object.entries(categoriesSent)
        .sort((a, b) => b[1].amount - a[1].amount)[0];
      summary.conclusions.push(`Votre catégorie de facturation principale est "${topCategory[0]}" avec ${topCategory[1].amount} TND (${topCategory[1].count} facture(s)).`);
    }

    if (totalAmountSent > totalAmountReceived * 1.5) {
      summary.conclusions.push("Vos dépenses dépassent significativement vos revenus sur cette période. Analysez vos dépenses pour identifier des économies potentielles.");
    }

    if (summary.conclusions.length === 0) {
      summary.conclusions.push("Aucune recommandation particulière pour cette période.");
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error("Erreur lors de la génération du résumé des factures:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Configuration pour l'upload de factures scannées
const scanStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, "../uploads/scans");
      if (!fs.existsSync(uploadDir)) {
        await fsPromises.mkdir(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const scanUpload = multer({
  storage: scanStorage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers JPEG, PNG et PDF sont autorisés!"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

exports.uploadScan = scanUpload.single("scan");

exports.extractInvoiceData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
    }

    const filePath = req.file.path;
    let processedImagePath = filePath;

    // Si le fichier est une image, prétraiter l'image pour améliorer l'OCR
    if (/\.(jpg|jpeg|png)$/i.test(filePath)) {
      const outputPath = `${filePath}_processed.png`;
      await sharp(filePath)
        .greyscale() // Convertir en niveaux de gris
        .normalize() // Normaliser les niveaux
        .sharpen() // Accentuer les détails
        .threshold(128) // Binarisation
        .toFile(outputPath);
      
      processedImagePath = outputPath;
    }

    // Utiliser Tesseract.js pour extraire le texte
    const worker = await createWorker('fra+eng');
    const { data } = await worker.recognize(processedImagePath);
    await worker.terminate();

    console.log("Texte extrait:", data.text);

    // Extraire les informations clés du texte
    const extractedData = {
      amount: extractAmount(data.text),
      date: extractDate(data.text),
      dueDate: extractDueDate(data.text),
      invoiceNumber: extractInvoiceNumber(data.text),
      recipient: extractRecipient(data.text),
      sender: extractSender(data.text),
      items: extractItems(data.text),
      rawText: data.text
    };

    // Nettoyer les fichiers temporaires
    if (processedImagePath !== filePath) {
      fs.unlink(processedImagePath, (err) => {
        if (err) console.error("Erreur lors de la suppression du fichier temporaire:", err);
      });
    }

    res.status(200).json({
      message: "Données extraites avec succès",
      data: extractedData
    });
  } catch (error) {
    console.error("Erreur lors de l'extraction des données de la facture:", error);
    res.status(500).json({ message: "Erreur lors de l'extraction des données", error: error.message });
  }
};

// Fonctions d'extraction des données spécifiques
const extractAmount = (text) => {
  // Recherche de montants avec des formats comme "1234,56 €", "1234.56 €", "1 234,56 €", etc.
  const amountMatches = text.match(/(\d+[\s.,]\d+|\d+)[\s]*(€|EUR|DT|TND)/gi) || [];
  
  if (amountMatches.length > 0) {
    // Prendre le montant le plus élevé (souvent le total)
    return amountMatches
      .map(match => {
        const numericPart = match.replace(/[^\d.,]/g, '').replace(',', '.');
        return parseFloat(numericPart);
      })
      .sort((a, b) => b - a)[0] || null;
  }
  
  return null;
};

const extractDate = (text) => {
  // Recherche de dates au format JJ/MM/AAAA, JJ-MM-AAAA, etc.
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;
  const matches = [...text.matchAll(dateRegex)];
  
  if (matches.length > 0) {
    // Prendre la première date trouvée
    const match = matches[0];
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    // Ajuster l'année si elle est à 2 chiffres
    const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
    
    return new Date(fullYear, month - 1, day);
  }
  
  return null;
};

const extractDueDate = (text) => {
  // Rechercher les mentions d'échéance
  const dueDateLines = text.match(/échéance.*?(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i) || 
                      text.match(/date limite.*?(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i) ||
                      text.match(/à payer avant.*?(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i);
  
  if (dueDateLines && dueDateLines.length >= 4) {
    const day = parseInt(dueDateLines[1]);
    const month = parseInt(dueDateLines[2]);
    const year = parseInt(dueDateLines[3]);
    
    // Ajuster l'année si elle est à 2 chiffres
    const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
    
    return new Date(fullYear, month - 1, day);
  }
  
  // Si aucune date d'échéance spécifique n'est trouvée, on peut estimer à 30 jours après la date de facture
  const invoiceDate = extractDate(text);
  if (invoiceDate) {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }
  
  return null;
};

const extractInvoiceNumber = (text) => {
  // Rechercher les numéros de facture courants
  const invoiceMatches = text.match(/facture\s*(?:n[o°]?)?\s*:?\s*([A-Za-z0-9\-_\/]+)/i) ||
                         text.match(/invoice\s*(?:n[o°]?)?\s*:?\s*([A-Za-z0-9\-_\/]+)/i) ||
                         text.match(/n[o°]?\s*(?:facture|invoice)\s*:?\s*([A-Za-z0-9\-_\/]+)/i);
  
  if (invoiceMatches && invoiceMatches.length > 1) {
    return invoiceMatches[1].trim();
  }
  
  return null;
};

const extractRecipient = (text) => {
  // Rechercher les sections courantes où on trouve les informations du destinataire
  const recipientBlockRegex = /client\s*:([^]*?)(?:facture|montant|date|total)/i;
  const recipientMatches = text.match(recipientBlockRegex);
  
  if (recipientMatches && recipientMatches.length > 1) {
    return recipientMatches[1].trim();
  }
  
  return null;
};

const extractSender = (text) => {
  // Les informations de l'émetteur sont souvent en haut de la facture
  const firstLines = text.split('\n').slice(0, 10).join('\n');
  return firstLines;
};

const extractItems = (text) => {
  // Tenter d'extraire une liste d'articles facturés
  // C'est complexe car chaque facture a un format différent, mais on peut chercher des motifs typiques
  const itemRegex = /(\d+|\d+[.,]\d+)\s*x\s*([^]*?)\s*(\d+[.,]\d+)/g;
  const matches = [...text.matchAll(itemRegex)];
  
  if (matches.length > 0) {
    return matches.map(match => ({
      quantity: parseFloat(match[1].replace(',', '.')),
      description: match[2].trim(),
      unitPrice: parseFloat(match[3].replace(',', '.'))
    }));
  }
  
  return [];
};