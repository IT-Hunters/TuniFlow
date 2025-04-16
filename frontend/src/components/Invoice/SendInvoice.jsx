import React, { useState } from 'react';
import CoolSidebar from "../sidebarHome/newSidebar"; 
import Navbar from "../navbarHome/NavbarHome"; 
import axios from 'axios';
import './invoiceStyles.css'; // Ensure this file exists

const SendInvoice = () => {
    const [invoiceId, setInvoiceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");
    const handleChange = (e) => {
        setInvoiceId(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!invoiceId.trim()) {
            alert("Veuillez entrer un ID de facture valide.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`http://localhost:3000/invoices/send/${encodeURIComponent(invoiceId)}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
            alert(response.data.message);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la facture:', error);
            setError(error.response?.data?.message || 'Échec de l\'envoi de la facture');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="send-invoice-page">
            <CoolSidebar /> 
            <div className="send-invoice-main">
                <Navbar />
                <div className="send-invoice-container">
                    {error && <p className="error-message">{error}</p>}
                    <h2 className="invoice-header">Envoyer une Facture</h2>
                    <form className="invoice-form" onSubmit={handleSubmit}>
                        <input 
                            type="text" 
                            placeholder="ID de la Facture" 
                            value={invoiceId} 
                            onChange={handleChange} 
                            required 
                            className="invoice-input"
                        />
                        <button type="submit" disabled={loading} className="invoice-submit-button">
                            {loading ? "Envoi..." : "Envoyer la Facture"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SendInvoice;
