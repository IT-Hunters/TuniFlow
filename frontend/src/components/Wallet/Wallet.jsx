import React from 'react';
import './wallet.css';

const Wallet = () => {
  const mockWallet = {
    userId: 'USR12345',
    balance: 1.2456, // In BTC
    currency: 'BTC',
    type: 'Spot Wallet',
  };

  return (
    <div className="wallet-container">
      <header className="wallet-header">
        <h1>Portefeuille</h1>
        <span className="wallet-type">{mockWallet.type}</span>
      </header>
      <div className="wallet-balance">
        <p className="balance-label">Solde Total</p>
        <h2 className="balance-amount">{mockWallet.balance} {mockWallet.currency}</h2>
        <p className="balance-usd">≈ $45,678.90 USD</p>
      </div>
      <div className="wallet-actions">
        <button className="action-button deposit">Déposer</button>
        <button className="action-button withdraw">Retirer</button>
        <button className="action-button transfer">Transférer</button>
      </div>
      <div className="wallet-details">
        <p><strong>ID Utilisateur:</strong> {mockWallet.userId}</p>
        <p><strong>Type:</strong> {mockWallet.type}</p>
      </div>
    </div>
  );
};

export default Wallet;