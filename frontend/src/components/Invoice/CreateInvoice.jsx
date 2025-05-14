import React, { useState, useEffect } from 'react';
import CoolSidebar from "../sidebarHome/newSidebar"; 
import Navbar from "../navbarHome/NavbarHome"; 
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './invoiceStyles.css';
import { useTranslation } from 'react-i18next';

const CreateInvoice = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const extractedData = location.state?.extractedData;

  // Initialiser avec les données OCR si disponibles
  const [invoiceData, setInvoiceData] = useState({
    amount: extractedData?.amount || '',
    due_date: extractedData?.dueDate ? new Date(extractedData.dueDate).toISOString().split('T')[0] : '',
    category: '',
    customNotes: extractedData?.rawText ? `Données extraites par OCR:\n\n${extractedData.rawText.substring(0, 500)}...` : ''
  });
  const [businessOwner, setBusinessOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const categoryOptions = [
    "Consulting",
    "Services",
    "Products",
    "Freelance",
    "Maintenance",
    "Other"
  ];

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/project/my-project', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const project = response.data;
        setBusinessOwner({ 
          fullname: project.businessOwner.fullname, 
          lastname: project.businessOwner.lastname 
        });
      } catch (error) {
        console.error('Error fetching project:', error);
        setError(t("Unable to load recipient information"));
      }
    };
    fetchProjectData();
  }, [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      if (value === "Other") {
        setIsCustomCategory(true);
        setInvoiceData({ ...invoiceData, category: '' });
      } else {
        setIsCustomCategory(false);
        setInvoiceData({ ...invoiceData, category: value });
      }
    } else {
      setInvoiceData({ ...invoiceData, [name]: value });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const generateAIDescription = async () => {
    if (!invoiceData.amount || !invoiceData.category) {
      setError(t("Please fill in the amount and category first"));
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/project/my-project', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const project = response.data;
      const amount = Number(invoiceData.amount);

      // Créer un template de description basé sur la catégorie
      const getTemplateByCategory = (category, amount) => {
        const templates = {
          'Consulting': `Services de consultation professionnelle fournis à votre entreprise, comprenant conseils stratégiques, analyses et recommandations. Montant total de la consultation : ${amount} TND.`,
          'Services': `Services professionnels fournis selon notre accord. Prestation de services complétée selon les spécifications. Montant total : ${amount} TND.`,
          'Products': `Livraison et implémentation des produits selon les spécifications. Tous les éléments livrés en parfait état. Valeur totale : ${amount} TND.`,
          'Freelance': `Travail freelance complété selon les exigences du projet. Livrables soumis et approuvés. Valeur totale du projet : ${amount} TND.`,
          'Maintenance': `Services de maintenance et support fournis, incluant mises à jour système et assistance technique. Frais total de maintenance : ${amount} TND.`,
          'Other': `Services professionnels et livrables fournis selon notre accord. Montant total : ${amount} TND.`
        };

        return templates[category] || templates['Other'];
      };

      // Générer une description détaillée
      const generateDetailedDescription = (category, amount, project) => {
        const baseDescription = getTemplateByCategory(category, amount);
        const date = new Date().toLocaleDateString();
        const recipientDetails = project.businessOwner ? 
          `${project.businessOwner.fullname} ${project.businessOwner.lastname}` : 
          'Destinataire';

        return `
Facture - ${date}

Destinataire: ${recipientDetails}

${baseDescription}

Détails de la prestation:
- Type de service: ${category}
- Montant: ${amount} TND
- Date de service: ${date}

Informations complémentaires:
- Travail réalisé conformément aux spécifications convenues
- Contrôles qualité effectués
- Standards professionnels respectés
- Documentation et livrables inclus

Merci de votre confiance!
        `.trim();
      };

      const generatedDescription = generateDetailedDescription(
        invoiceData.category,
        amount,
        project
      );

      setInvoiceData(prev => ({ ...prev, customNotes: generatedDescription }));
      
    } catch (error) {
      console.error('Error generating description:', error);
      setError(t("Failed to generate AI description"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      let uploadedLogoUrl = null;

      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const uploadResponse = await axios.post('http://localhost:3000/invoices/upload-logo', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        uploadedLogoUrl = uploadResponse.data.logoUrl;
        setLogoUrl(uploadedLogoUrl);
      }

      const response = await axios.post('http://localhost:3000/invoices/create', {
        ...invoiceData,
        logoUrl: uploadedLogoUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const invoiceId = response.data.invoice._id;

      await axios.post(`http://localhost:3000/invoices/send/${invoiceId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      setInvoiceData({ amount: '', due_date: '', category: '', customNotes: '' });
      setIsCustomCategory(false);
      setLogoFile(null);
      setLogoUrl(null);
      setLogoPreview(null);
      
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || t("Failed to create or send the invoice"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoices = () => {
    navigate('/manager-invoices');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <div className="invoice-container-wrapper">
            <div className="invoice-container">
              <h2 className="invoice-header">{t("Create an Invoice")}</h2>

              {businessOwner ? (
                <p className="recipient-info">
                  <span className="recipient-label">{t("Recipient")}:</span> 
                  <span className="recipient-name">{businessOwner.fullname} {businessOwner.lastname}</span>
                </p>
              ) : (
                <p className="loading-recipient">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  {t("Loading recipient information")}
                </p>
              )}
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{t("Invoice created and sent successfully")}</div>}
              
              <form className="invoice-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className="input-label" htmlFor="amount">{t("Amount")}</label>
                  <input 
                    id="amount"
                    type="number" 
                    name="amount" 
                    className="invoice-input" 
                    placeholder={t("Amount")} 
                    value={invoiceData.amount}
                    onChange={handleChange} 
                    required 
                    min="0"
                    step="0.01"
                  /> 
                </div>
                
                <div className="input-group">
                  <label className="input-label" htmlFor="due_date">{t("Due Date")}</label>
                  <input 
                    id="due_date"
                    type="date" 
                    name="due_date" 
                    className="invoice-input" 
                    value={invoiceData.due_date}
                    onChange={handleChange} 
                    required 
                    min={today}
                  /> 
                </div>
                
                <div className="input-group">
                  <label className="input-label" htmlFor="category">{t("Category")}</label>
                  <select
                    id="category"
                    name="category"
                    className="invoice-input"
                    value={isCustomCategory ? "Other" : invoiceData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>{t("Select a category")}</option>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {isCustomCategory && (
                  <div className="input-group">
                    <label className="input-label" htmlFor="customCategory">{t("Custom Category")}</label>
                    <input
                      id="customCategory"
                      type="text"
                      name="category"
                      className="invoice-input"
                      placeholder={t("Enter custom category")}
                      value={invoiceData.category}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label" htmlFor="logo">Logo (Optional)</label>
                  <div className="file-input-wrapper">
                    <input
                      id="logo"
                      type="file"
                      name="logo"
                      className="file-input"
                      accept="image/jpeg,image/png"
                      onChange={handleLogoChange}
                    />
                    <div className="file-input-button">
                      {logoFile ? logoFile.name : 'Choose a file'}
                    </div>
                    {logoFile && (
                      <div className="file-name-display">
                        Selected file: {logoFile.name}
                      </div>
                    )}
                  </div>
                  {logoPreview && (
                    <div className="logo-preview">
                      <img src={logoPreview} alt="Logo Preview" className="logo-preview-image" />
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="customNotes">
                    {t("Custom Notes (Optional)")}
                    {invoiceData.customNotes && (
                      <span className="ai-badge">{t("AI Generated")}</span>
                    )}
                  </label>
                  <div className="ai-description-container">
                    <textarea
                      id="customNotes"
                      name="customNotes"
                      className="invoice-input"
                      placeholder={t("Add custom notes or let AI generate them")}
                      value={invoiceData.customNotes}
                      onChange={handleChange}
                      rows="6"
                    />
                    <button 
                      type="button" 
                      onClick={generateAIDescription}
                      className={`ai-generate-button ${isGenerating ? 'generating' : ''}`}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          {t("Generating with AI")}
                          <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </>
                      ) : (
                        t("Generate with AI")
                      )}
                    </button>
                  </div>
                </div>
                
                <button type="submit" disabled={loading} className="invoice-button">
                  {loading ? (
                    <>
                      <span className="loading"></span>
                      {t("Processing")}
                    </>
                  ) : t("Create and Send Invoice")}
                </button> 
              </form>
            </div>

            <div className="invoice-actions-sidebar">
              <h3 className="actions-header">{t("Actions")}</h3>
              <button onClick={handleViewInvoices} className="view-invoices-button">
                {t("View Invoices")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>  
  );
};

export default CreateInvoice;