import React from 'react';
import './transaction.css';

const Transaction = () => {
  const mockTransactions = [
    {
      id: 'TXN001',
      amount: 0.025,
      currency: 'BTC',
      type: 'income',
      status: 'completed',
      date: '2025-02-24 14:30:00',
      description: 'Dépôt depuis Coinbase',
    },
    {
      id: 'TXN002',
      amount: 0.01,
      currency: 'BTC',
      type: 'expense',
      status: 'pending',
      date: '2025-02-25 09:15:00',
      description: 'Retrait vers adresse externe',
    },
    {
      id: 'TXN003',
      amount: 0.05,
      currency: 'BTC',
      type: 'income',
      status: 'completed',
      date: '2025-02-23 18:45:00',
      description: 'Transfert reçu',
    },
  ];

  return (
    <div className="transaction-container">
      <header className="transaction-header">
        <h1>Historique des Transactions</h1>
      </header>
      <div className="transaction-filters">
        <select className="filter-select">
          <option value="">Tous les types</option>
          <option value="income">Revenus</option>
          <option value="expense">Dépenses</option>
        </select>
        <select className="filter-select">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="completed">Terminé</option>
          <option value="canceled">Annulé</option>
        </select>
        <input type="date" className="filter-date" />
        <input type="date" className="filter-date" />
      </div>
      <div className="transaction-list">
        {mockTransactions.map((txn) => (
          <div key={txn.id} className="transaction-item">
            <div className="txn-info">
              <p className="txn-amount">
                {txn.type === 'income' ? '+' : '-'} {txn.amount} {txn.currency}
              </p>
              <p className="txn-type">{txn.type === 'income' ? 'Revenus' : 'Dépenses'}</p>
              <p className="txn-status">{txn.status}</p>
              <p className="txn-date">{txn.date}</p>
              {txn.description && <p className="txn-desc">{txn.description}</p>}
            </div>
            {txn.status === 'pending' && (
              <button className="txn-action">Annuler</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transaction;