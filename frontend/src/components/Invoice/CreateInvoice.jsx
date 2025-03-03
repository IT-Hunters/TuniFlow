import React, { useState } from 'react';
import CoolSidebar from "../sidebarHome/newSidebar"; 
import Navbar from "../navbarHome/NavbarHome"; 
import axios from 'axios';
import './invoiceStyles.css'; 

const CreateInvoice = () => {
    const [invoiceData, setInvoiceData] = useState({
        user_id: '',
        amount: '',
        due_date: '',
        category: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData({ ...invoiceData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/invoices', invoiceData);
            alert(response.data.message);
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice');
        }
    };

    return (
        <div className="create-invoice-page">
            <CoolSidebar />
            <div className="create-invoice-main">
                <Navbar />
                <div className="invoice-container">
                    <h2 className="invoice-header">Create Invoice</h2>
                    <form className="invoice-form" onSubmit={handleSubmit}>
                        <input 
                            type="number" 
                            name="user_id" 
                            className="invoice-input" 
                            placeholder="User ID" 
                            onChange={handleChange} 
                            required 
                        /> 
                        <input 
                            type="number" 
                            name="amount" 
                            className="invoice-input" 
                            placeholder="Amount" 
                            onChange={handleChange} 
                            required 
                        /> 
                        <input 
                            type="date" 
                            name="due_date" 
                            className="invoice-input" 
                            onChange={handleChange} 
                            required 
                        /> 
                        <input 
                            type="text" 
                            name="category" 
                            className="invoice-input" 
                            placeholder="Category" 
                            onChange={handleChange} 
                        /> 
                        <button type="submit" className="invoice-button">Create Invoice</button> 
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateInvoice;
