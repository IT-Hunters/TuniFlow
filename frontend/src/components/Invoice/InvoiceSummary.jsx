import React, { useState, useEffect } from 'react';
import CoolSidebar from "../sidebarHome/newSidebar"; 
import Navbar from "../navbarHome/NavbarHome"; 
import axios from 'axios';
import { Card, Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './invoiceStyles.css';

const InvoiceSummary = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarters] = useState([
    { value: 1, label: '1er Trimestre (Jan-Mar)' },
    { value: 4, label: '2ème Trimestre (Avr-Jun)' },
    { value: 7, label: '3ème Trimestre (Juil-Sep)' },
    { value: 10, label: '4ème Trimestre (Oct-Déc)' },
  ]);
  const [years] = useState(Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i));

  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      let params = { period };
      if (period === 'monthly') {
        params.year = year;
        params.month = month;
      } else if (period === 'quarterly') {
        params.year = year;
        params.month = quarters.find(q => q.value === parseInt(month))?.value || 1;
      } else if (period === 'yearly') {
        params.year = year;
      }

      const response = await axios.get('http://localhost:3000/invoices/summary', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSummary(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération du résumé:', err);
      setError(err.response?.data?.message || 'Erreur lors de la récupération du résumé');
      setLoading(false);
    }
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
  };

  const handleMonthChange = (e) => {
    setMonth(parseInt(e.target.value));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <Container className="my-5">
            <Card className="invoice-summary-card">
              <div className="invoice-summary-header">
                <h2 className="invoice-summary-title">Résumé des Factures</h2>
                <p className="invoice-summary-period">
                  {period === 'monthly' 
                    ? `Mensuel - ${new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}` 
                    : period === 'quarterly'
                      ? `Trimestriel - ${quarters.find(q => q.value === parseInt(month))?.label} ${year}`
                      : `Annuel - ${year}`}
                </p>
              </div>

              <div className="invoice-summary-period-selector">
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Période</Form.Label>
                      <Form.Select value={period} onChange={handlePeriodChange}>
                        <option value="monthly">Mensuelle</option>
                        <option value="quarterly">Trimestrielle</option>
                        <option value="yearly">Annuelle</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Année</Form.Label>
                      <Form.Select value={year} onChange={handleYearChange}>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {period !== 'yearly' && (
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>{period === 'monthly' ? 'Mois' : 'Trimestre'}</Form.Label>
                        <Form.Select value={month} onChange={handleMonthChange}>
                          {period === 'monthly' 
                            ? Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {new Date(2000, i).toLocaleString('fr-FR', { month: 'long' })}
                                </option>
                              ))
                            : quarters.map(q => (
                                <option key={q.value} value={q.value}>{q.label}</option>
                              ))
                          }
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <div className="d-grid">
                  <Button variant="primary" onClick={fetchSummary} disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Génération du résumé...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sync-alt me-2"></i>
                        Générer le résumé
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-4 text-center">
                  <Alert variant="danger">
                    <i className="fas fa-exclamation-triangle me-2"></i> {error}
                  </Alert>
                </div>
              )}

              {loading && !summary && (
                <div className="p-5 text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Analyse des données de facturation en cours...</p>
                </div>
              )}

              {summary && (
                <>
                  <div className="invoice-summary-overview">
                    {summary.overview}
                  </div>

                  <div className="invoice-summary-section">
                    <div className="invoice-summary-section-title">
                      <i className="fas fa-chart-pie"></i> Aperçu global
                    </div>

                    <div className="invoice-summary-stats">
                      <div className="invoice-summary-stat-item">
                        <div className="invoice-summary-stat-value">
                          {summary.sentInvoices.total}
                        </div>
                        <div className="invoice-summary-stat-label">Factures Envoyées</div>
                      </div>

                      <div className="invoice-summary-stat-item">
                        <div className="invoice-summary-stat-value">
                          {formatAmount(summary.sentInvoices.totalAmount)}
                        </div>
                        <div className="invoice-summary-stat-label">Montant Envoyé</div>
                      </div>

                      <div className="invoice-summary-stat-item">
                        <div className="invoice-summary-stat-value">
                          {summary.receivedInvoices.total}
                        </div>
                        <div className="invoice-summary-stat-label">Factures Reçues</div>
                      </div>

                      <div className="invoice-summary-stat-item">
                        <div className="invoice-summary-stat-value">
                          {formatAmount(summary.receivedInvoices.totalAmount)}
                        </div>
                        <div className="invoice-summary-stat-label">Montant Reçu</div>
                      </div>
                    </div>

                    <div className="invoice-summary-stats">
                      <div className="invoice-summary-stat-item">
                        <div className="invoice-summary-stat-value">
                          {summary.sentInvoices.paid}
                        </div>
                        <div className="invoice-summary-stat-label">Factures Payées</div>
                      </div>

                      <div className="invoice-summary-stat-item">
                        <div className="invoice-summary-stat-value">
                          {summary.sentInvoices.pending}
                        </div>
                        <div className="invoice-summary-stat-label">Factures En attente</div>
                      </div>

                      <div className="invoice-summary-stat-item">
                        <div className="invoice-summary-stat-value">
                          {Math.round((summary.sentInvoices.paid / summary.sentInvoices.total) * 100) || 0}%
                        </div>
                        <div className="invoice-summary-stat-label">Taux de Paiement</div>
                      </div>

                      <div className="invoice-summary-stat-item">
                        <div className="invoice-summary-stat-value">
                          {summary.receivedInvoices.pending}
                        </div>
                        <div className="invoice-summary-stat-label">À Payer</div>
                      </div>
                    </div>
                  </div>

                  {Object.keys(summary.sentInvoices.categories || {}).length > 0 && (
                    <div className="invoice-summary-section">
                      <div className="invoice-summary-section-title">
                        <i className="fas fa-tags"></i> Répartition par catégorie
                      </div>

                      {Object.entries(summary.sentInvoices.categories).map(([category, data]) => (
                        <div key={category} className="invoice-summary-category">
                          <div className="invoice-summary-category-header">
                            <div className="invoice-summary-category-name">{category}</div>
                            <div className="invoice-summary-category-count">{data.count} facture(s)</div>
                          </div>
                          <div className="invoice-summary-category-amount">
                            {formatAmount(data.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {summary.topInvoices && summary.topInvoices.length > 0 && (
                    <div className="invoice-summary-section">
                      <div className="invoice-summary-section-title">
                        <i className="fas fa-trophy"></i> Top 5 des factures
                      </div>

                      <div className="invoice-summary-top-invoices">
                        {summary.topInvoices.map((invoice, index) => (
                          <div key={index} className="invoice-summary-invoice-row">
                            <div className="invoice-summary-invoice-amount">
                              {formatAmount(invoice.amount)}
                            </div>
                            <div className="invoice-summary-invoice-details">
                              <div className="invoice-summary-invoice-party">{invoice.party}</div>
                              <div className="invoice-summary-invoice-info">
                                <span className="invoice-summary-invoice-date">
                                  <i className="far fa-calendar-alt me-1"></i> 
                                  {formatDate(invoice.due_date)}
                                </span>
                                <span className={`invoice-summary-badge ${
                                  invoice.type === 'Envoyée' 
                                    ? 'invoice-summary-badge-sent' 
                                    : 'invoice-summary-badge-received'
                                }`}>
                                  {invoice.type}
                                </span>
                              </div>
                            </div>
                            <div className="ms-auto">
                              <span className={`badge ${
                                invoice.status === 'PAID' 
                                  ? 'bg-success' 
                                  : invoice.status === 'PENDING' 
                                    ? 'bg-warning' 
                                    : 'bg-danger'
                              }`}>
                                {invoice.status === 'PAID' ? 'Payée' : 'En attente'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.conclusions && summary.conclusions.length > 0 && (
                    <div className="invoice-summary-section">
                      <div className="invoice-summary-section-title">
                        <i className="fas fa-lightbulb"></i> Insights et recommandations
                      </div>

                      <div className="invoice-summary-conclusions">
                        {summary.conclusions.map((conclusion, index) => (
                          <div key={index} className="invoice-summary-conclusion-item">
                            <i className="fas fa-check-circle invoice-summary-conclusion-icon"></i>
                            <div className="invoice-summary-conclusion-text">{conclusion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 text-center">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => navigate('/manager-invoices')}
                      className="me-2"
                    >
                      <i className="fas fa-file-invoice me-2"></i>
                      Voir toutes les factures
                    </Button>
                    <Button 
                      variant="outline-success" 
                      onClick={() => navigate('/create-invoice')}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Créer une nouvelle facture
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary; 