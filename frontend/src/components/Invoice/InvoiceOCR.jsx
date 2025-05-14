import React, { useState } from 'react';
import CoolSidebar from "../sidebarHome/newSidebar"; 
import Navbar from "../navbarHome/NavbarHome"; 
import axios from 'axios';

import { useNavigate } from 'react-router-dom';
import './invoiceStyles.css';

const InvoiceOCR = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [autoCreateInvoice, setAutoCreateInvoice] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);

    if (!selectedFile) return;

    // Vérifier le type de fichier
    const acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!acceptedTypes.includes(selectedFile.type)) {
      setError('Format de fichier non supporté. Veuillez utiliser un fichier JPEG, PNG ou PDF.');
      return;
    }

    // Vérifier la taille du fichier (10 MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Taille maximale: 10 MB');
      return;
    }

    setFile(selectedFile);

    // Créer une prévisualisation pour les images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier à analyser');
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedData(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('scan', file);

    try {
      const response = await axios.post('http://localhost:3000/invoices/extract-ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setExtractedData(response.data.data);
      setSuccess(true);
      setLoading(false);

      if (autoCreateInvoice && response.data.data) {
        // Naviguer vers la création de facture avec les données pré-remplies
        navigate('/create-invoice', { 
          state: { 
            extractedData: response.data.data 
          } 
        });
      }
    } catch (err) {
      console.error('Erreur lors de l\'extraction OCR:', err);
      setError(err.response?.data?.message || 'Une erreur s\'est produite lors de l\'extraction des données');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non détecté';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <Container className="my-5">
            <Card className="invoice-ocr-card">
              <Card.Header className="text-center bg-primary text-white">
                <h2>Extraction de données de facture par IA</h2>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form onSubmit={handleSubmit}>
                      <div className="file-upload-container mb-4">
                        <div className={`file-upload-area ${file ? 'has-file' : ''}`}>
                          <input
                            type="file"
                            id="scan"
                            className="file-input"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf"
                          />
                          <div className="file-upload-content">
                            <i className="fas fa-cloud-upload-alt upload-icon"></i>
                            <p>Glissez votre facture ici ou cliquez pour parcourir</p>
                            <p className="file-types">Formats acceptés: JPG, PNG, PDF</p>
                            {file && <p className="selected-file">{file.name}</p>}
                          </div>
                        </div>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="auto-create"
                          label="Créer automatiquement une facture avec les données extraites"
                          checked={autoCreateInvoice}
                          onChange={(e) => setAutoCreateInvoice(e.target.checked)}
                        />
                      </Form.Group>

                      <div className="d-grid gap-2">
                        <Button 
                          variant="primary" 
                          type="submit" 
                          disabled={!file || loading}
                          className="extraction-button"
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Extraction en cours...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-magnifying-glass me-2"></i>
                              Extraire les données
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {error && (
                        <Alert variant="danger" className="mt-3">
                          <i className="fas fa-exclamation-triangle me-2"></i> {error}
                        </Alert>
                      )}
                      
                      {success && (
                        <Alert variant="success" className="mt-3">
                          <i className="fas fa-check-circle me-2"></i> Extraction réussie!
                        </Alert>
                      )}
                    </Form>
                  </Col>
                  
                  <Col md={6}>
                    <div className="preview-container">
                      {preview ? (
                        <div className="image-preview">
                          <img src={preview} alt="Prévisualisation" className="img-fluid rounded" />
                        </div>
                      ) : file && file.type === 'application/pdf' ? (
                        <div className="pdf-preview">
                          <i className="fas fa-file-pdf pdf-icon"></i>
                          <p>Fichier PDF sélectionné</p>
                          <p className="pdf-name">{file.name}</p>
                        </div>
                      ) : (
                        <div className="no-preview">
                          <i className="fas fa-image no-preview-icon"></i>
                          <p>Aucune prévisualisation disponible</p>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>

                {extractedData && (
                  <div className="extracted-data-container mt-4">
                    <h3 className="text-center mb-3">Données extraites</h3>
                    <Row>
                      <Col md={6}>
                        <Table striped bordered hover>
                          <tbody>
                            <tr>
                              <th>Montant</th>
                              <td>
                                {extractedData.amount 
                                  ? `${extractedData.amount} TND` 
                                  : <Badge bg="warning">Non détecté</Badge>}
                              </td>
                            </tr>
                            <tr>
                              <th>Date de facture</th>
                              <td>{extractedData.date ? formatDate(extractedData.date) : <Badge bg="warning">Non détecté</Badge>}</td>
                            </tr>
                            <tr>
                              <th>Date d'échéance</th>
                              <td>{extractedData.dueDate ? formatDate(extractedData.dueDate) : <Badge bg="warning">Non détecté</Badge>}</td>
                            </tr>
                            <tr>
                              <th>Numéro de facture</th>
                              <td>{extractedData.invoiceNumber || <Badge bg="warning">Non détecté</Badge>}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <Table striped bordered hover>
                          <tbody>
                            <tr>
                              <th>Émetteur</th>
                              <td>{extractedData.sender || <Badge bg="warning">Non détecté</Badge>}</td>
                            </tr>
                            <tr>
                              <th>Destinataire</th>
                              <td>{extractedData.recipient || <Badge bg="warning">Non détecté</Badge>}</td>
                            </tr>
                            <tr>
                              <th>Articles</th>
                              <td>
                                {extractedData.items && extractedData.items.length > 0 ? (
                                  <ul className="mb-0 ps-3">
                                    {extractedData.items.map((item, idx) => (
                                      <li key={idx}>
                                        {item.quantity} x {item.description} ({item.unitPrice} TND)
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <Badge bg="warning">Non détecté</Badge>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>

                    <div className="d-grid gap-2 mt-3">
                      <Button 
                        variant="success" 
                        onClick={() => navigate('/create-invoice', { state: { extractedData } })}
                      >
                        <i className="fas fa-file-invoice me-2"></i>
                        Créer une facture avec ces données
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default InvoiceOCR; 