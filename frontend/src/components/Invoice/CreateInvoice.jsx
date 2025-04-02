import React, { useState, useEffect } from 'react';
import CoolSidebar from "../sidebarHome/newSidebar"; 
import Navbar from "../navbarHome/NavbarHome"; 
import axios from 'axios';
import './invoiceStyles.css';

const CreateInvoice = () => {
  const [invoiceData, setInvoiceData] = useState({
    amount: '',
    due_date: '',
    category: ''
  });
  const [businessOwner, setBusinessOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
        setError('Unable to load recipient information. Please try again later.');
      }
    };
    fetchProjectData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/invoices/create', invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invoiceId = response.data.invoice._id;

      await axios.post(`http://localhost:3000/invoices/send/${invoiceId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      setInvoiceData({ amount: '', due_date: '', category: '' });
      
      // Réinitialiser le statut de succès après 3 secondes
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Failed to create or send the invoice');
    } finally {
      setLoading(false);
    }
  };

  // Formater la date d'aujourd'hui pour la valeur min du sélecteur de date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <div className="invoice-container">
            <h2 className="invoice-header">Create an Invoice</h2>
            
            {businessOwner ? (
              <p className="recipient-info">
                <span className="recipient-label">Recipient:</span> 
                <span className="recipient-name">{businessOwner.fullname} {businessOwner.lastname}</span>
              </p>
            ) : (
              <p className="loading-recipient">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                Loading recipient information
              </p>
            )}
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Invoice created and sent successfully!</div>}
            
            <form className="invoice-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label" htmlFor="amount">Amount</label>
                <input 
                  id="amount"
                  type="number" 
                  name="amount" 
                  className="invoice-input" 
                  placeholder="Enter invoice amount" 
                  value={invoiceData.amount}
                  onChange={handleChange} 
                  required 
                  min="0"
                  step="0.01"
                /> 
              </div>
              
              <div className="input-group">
                <label className="input-label" htmlFor="due_date">Due Date</label>
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
                <label className="input-label" htmlFor="category">Category</label>
                <input 
                  id="category"
                  type="text" 
                  name="category" 
                  className="invoice-input" 
                  placeholder="Enter invoice category (e.g. Consulting, Services)" 
                  value={invoiceData.category}
                  onChange={handleChange} 
                /> 
              </div>
              
              <button type="submit" disabled={loading} className="invoice-button">
                {loading ? (
                  <>
                    <span className="loading"></span>
                    Processing...
                  </>
                ) : 'Create and Send Invoice'}
              </button> 
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;