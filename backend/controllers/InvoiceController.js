const Bill = require('../model/Bill'); 
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


exports.createInvoice = async (req, res) => {
    try {
        const invoiceData = req.body; 
        const newInvoice = new Bill(invoiceData); 
        await newInvoice.save();
        res.status(201).json({ message: 'Invoice created successfully', invoice: newInvoice });
    } catch (error) {
        res.status(500).json({ message: 'Error creating invoice', error });
    }
};


exports.sendInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        
        
        const invoice = await Invoice.findById(invoiceId).populate("clientId");
        if (!invoice) return res.status(404).json({ message: "Facture non trouvée" });

      
        const pdfPath = await generateInvoicePDF(invoice);

       
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS  
            }
        });

       
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: invoice.clientId.email,
            subject: `Facture ${invoice.invoiceNumber}`,
            text: `Bonjour ${invoice.clientId.name},\n\nVeuillez trouver ci-joint votre facture ${invoice.invoiceNumber}.`,
            attachments: [{ filename: `invoice_${invoice.invoiceNumber}.pdf`, path: pdfPath }]
        };

        
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Facture envoyée avec succès !" });
    } catch (error) {
        console.error("Erreur envoi facture:", error);
        res.status(500).json({ message: "Erreur lors de l'envoi de la facture" });
    }
};


const generateInvoicePDF = async (invoice) => {
    return new Promise((resolve, reject) => {
        const pdfPath = path.join(__dirname, `../invoices/invoice_${invoice.invoiceNumber}.pdf`);
        const doc = new PDFDocument();

        doc.pipe(fs.createWriteStream(pdfPath));

        doc.fontSize(20).text("Facture", { align: "center" });
        doc.fontSize(14).text(`Numéro: ${invoice.invoiceNumber}`);
        doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`);
        doc.text(`Client: ${invoice.clientId.name}`);
        doc.text(`Total: ${invoice.totalAmount} TND`);
        doc.end();

        doc.on("finish", () => resolve(pdfPath));
        doc.on("error", reject);
    });
};