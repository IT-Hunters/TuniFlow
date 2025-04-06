// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Définir les traductions
const resources = {
  en: {
    translation: {
      "My Invoices": "My Invoices",
      "My Sent Invoices": "My Sent Invoices",
      "Create an Invoice": "Create an Invoice",
      "Recipient": "Recipient",
      "Amount": "Amount",
      "Due Date": "Due Date",
      "Category": "Category",
      "Select a category": "Select a category",
      "Custom Category": "Custom Category",
      "Enter custom category": "Enter custom category",
      "Logo (Optional)": "Logo (Optional)",
      "Custom Notes (Optional)": "Custom Notes (Optional)",
      "Add custom notes": "Add custom notes (e.g., payment terms, instructions, etc.)",
      "Create and Send Invoice": "Create and Send Invoice",
      "View Invoices": "View Invoices",
      "Actions": "Actions",
      "Scan QR to Pay": "Scan QR to Pay",
      "Hide QR Scanner": "Hide QR Scanner",
      "Search by amount, category, or status": "Search by amount, category, or status...",
      "Loading invoices": "Loading invoices...",
      "No invoices found": "No invoices found",
      "Status": "Status",
      "Action": "Action",
      "Accept": "Accept",
      "Accepted": "Accepted",
      "History": "History",
      "Show History": "Show History",
      "Hide History": "Hide History",
      "Action History": "Action History",
      "Invoice Created": "Invoice Created",
      "Invoice Sent": "Invoice Sent",
      "Invoice Paid": "Invoice Paid",
      "Reminder Sent": "Reminder Sent",
      "by": "by",
      "on": "on",
      "No actions recorded": "No actions recorded",
      "Export to CSV": "Export to CSV",
      "Loading recipient information": "Loading recipient information",
      "Invoice created and sent successfully": "Invoice created and sent successfully!",
      "Unable to load recipient information": "Unable to load recipient information. Please try again later.",
      "Failed to create or send the invoice": "Failed to create or send the invoice",
      "Selected file": "Selected file",
      "Processing": "Processing..."
    }
  },
  fr: {
    translation: {
      "My Invoices": "Mes factures",
      "My Sent Invoices": "Mes factures envoyées",
      "Create an Invoice": "Créer une facture",
      "Recipient": "Destinataire",
      "Amount": "Montant",
      "Due Date": "Date d'échéance",
      "Category": "Catégorie",
      "Select a category": "Sélectionnez une catégorie",
      "Custom Category": "Catégorie personnalisée",
      "Enter custom category": "Entrez une catégorie personnalisée",
      "Logo (Optional)": "Logo (facultatif)",
      "Custom Notes (Optional)": "Notes personnalisées (facultatif)",
      "Add custom notes": "Ajoutez des notes personnalisées (ex. termes de paiement, instructions, etc.)",
      "Create and Send Invoice": "Créer et envoyer la facture",
      "View Invoices": "Voir les factures",
      "Actions": "Actions",
      "Scan QR to Pay": "Scanner QR pour payer",
      "Hide QR Scanner": "Masquer le scanner QR",
      "Search by amount, category, or status": "Rechercher par montant, catégorie ou statut...",
      "Loading invoices": "Chargement des factures...",
      "No invoices found": "Aucune facture trouvée",
      "Status": "Statut",
      "Action": "Action",
      "Accept": "Accepter",
      "Accepted": "Acceptée",
      "History": "Historique",
      "Show History": "Afficher l'historique",
      "Hide History": "Masquer l'historique",
      "Action History": "Historique des actions",
      "Invoice Created": "Facture créée",
      "Invoice Sent": "Facture envoyée",
      "Invoice Paid": "Facture payée",
      "Reminder Sent": "Rappel envoyé",
      "by": "par",
      "on": "le",
      "No actions recorded": "Aucune action enregistrée",
      "Export to CSV": "Exporter en CSV",
      "Loading recipient information": "Chargement des informations du destinataire",
      "Invoice created and sent successfully": "Facture créée et envoyée avec succès !",
      "Unable to load recipient information": "Impossible de charger les informations du destinataire. Veuillez réessayer plus tard.",
      "Failed to create or send the invoice": "Échec de la création ou de l'envoi de la facture",
      "Selected file": "Fichier sélectionné",
      "Processing": "Traitement..."
    }
  }
};

i18n
  .use(LanguageDetector) // Détecter la langue du navigateur
  .use(initReactI18next) // Intégrer avec React
  .init({
    resources,
    fallbackLng: 'en', // Langue par défaut
    interpolation: {
      escapeValue: false // React échappe déjà les valeurs
    }
  });

export default i18n;