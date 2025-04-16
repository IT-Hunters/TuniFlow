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

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token pour GET /project/my-project:', token);
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
        console.log('Erreur détails:', error.response?.data);
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
    try {
      const token = localStorage.getItem('token');
      console.log('Token pour POST /invoices/create:', token);
      console.log('Données envoyées:', invoiceData);
      const response = await axios.post('http://localhost:3000/invoices/create', invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invoiceId = response.data.invoice._id;

      console.log('Facture créée, ID:', invoiceId);
      await axios.post(`http://localhost:3000/invoices/send/${invoiceId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Invoice created and sent successfully!');
      setInvoiceData({ amount: '', due_date: '', category: '' });
    } catch (error) {
      console.error('Error:', error);
      console.log('Server response:', error.response?.data);
      alert('Failed to create or send the invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="invoice-container">
          <h2 className="invoice-header">Create an Invoice</h2>
          {businessOwner ? (
            <p>Recipient: {businessOwner.fullname} {businessOwner.lastname}</p>
          ) : (
            <p>Loading recipient...</p>
          )}
          <form className="invoice-form" onSubmit={handleSubmit}>
            <input 
              type="number" 
              name="amount" 
              className="invoice-input" 
              placeholder="Amount" 
              value={invoiceData.amount}
              onChange={handleChange} 
              required 
            /> 
            <input 
              type="date" 
              name="due_date" 
              className="invoice-input" 
              value={invoiceData.due_date}
              onChange={handleChange} 
              required 
            /> 
            <input 
              type="text" 
              name="category" 
              className="invoice-input" 
              placeholder="Category" 
              value={invoiceData.category}
              onChange={handleChange} 
            /> 
            <button type="submit" disabled={loading} className="invoice-button">
              {loading ? 'Sending...' : 'Create and Send'}
            </button> 
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;