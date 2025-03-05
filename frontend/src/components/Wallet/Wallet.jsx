import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./wallet.css";

const Wallet = () => {
  const { walletId } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [type, setType] = useState("");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState(0); // Montant pour dépôt, retrait et transfert
  const [receiverWalletId, setReceiverWalletId] = useState(""); // ID du portefeuille destinataire pour le transfert

  // Récupérer les données du portefeuille et des transactions
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token non trouvé");
        }

        // Récupérer les données du wallet
        const walletResponse = await axios.get(`http://localhost:5000/wallet/${walletId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWallet(walletResponse.data);

        // Récupérer les transactions du wallet
        const transactionsResponse = await axios.get(`http://localhost:5000/transaction/getTransactions/${walletId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(transactionsResponse.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [walletId]);

  // Fonction pour créer un nouveau portefeuille
  const handleCreateWallet = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const user_id = localStorage.getItem("userId"); // Récupérer l'ID de l'utilisateur connecté

      const response = await axios.post(
        "http://localhost:5000/addWallet",
        { user_id, type, projectId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Portefeuille créé avec succès !");
      console.log("Réponse du serveur :", response.data);
      setShowCreateWallet(false); // Masquer le formulaire après la création
      window.location.reload(); // Recharger la page pour afficher le nouveau portefeuille
    } catch (error) {
      console.error("Erreur lors de la création du portefeuille :", error);
      alert("Erreur lors de la création du portefeuille");
    }
  };

  // Fonction pour effectuer un dépôt
  const handleDeposit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/transaction/deposit/${walletId}`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Dépôt effectué avec succès !");
      console.log("Réponse du serveur :", response.data);
      window.location.reload(); // Recharger la page pour mettre à jour le solde
    } catch (error) {
      console.error("Erreur lors du dépôt :", error);
      alert("Erreur lors du dépôt");
    }
  };

  // Fonction pour effectuer un retrait
  const handleWithdraw = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/transaction/withdraw/${walletId}`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Retrait effectué avec succès !");
      console.log("Réponse du serveur :", response.data);
      window.location.reload(); // Recharger la page pour mettre à jour le solde
    } catch (error) {
      console.error("Erreur lors du retrait :", error);
      alert("Erreur lors du retrait");
    }
  };

  // Fonction pour effectuer un transfert
  const handleTransfer = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/transaction/transfer/${walletId}/${receiverWalletId}`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Transfert effectué avec succès !");
      console.log("Réponse du serveur :", response.data);
      window.location.reload(); // Recharger la page pour mettre à jour le solde
    } catch (error) {
      console.error("Erreur lors du transfert :", error);
      alert("Erreur lors du transfert");
    }
  };

  if (loading) return <div className="loading">Chargement en cours...</div>;
  if (error) return <div className="error">Erreur : {error}</div>;

  return (
    <div className="wallet-container">
      {/* En-tête du portefeuille */}
      <div className="wallet-header">
        <h2>Mon Portefeuille</h2>
        {wallet ? (
          <p>Solde : {wallet.balance} {wallet.currency}</p>
        ) : (
          <button onClick={() => setShowCreateWallet(true)}>Créer un portefeuille</button>
        )}
      </div>

      {/* Formulaire de création de portefeuille */}
      {showCreateWallet && (
        <div className="create-wallet-form">
          <h3>Créer un portefeuille</h3>
          <form onSubmit={handleCreateWallet}>
            <label>
              Type de portefeuille :
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              />
            </label>
            <label>
              ID du projet (optionnel) :
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </label>
            <button type="submit">Créer</button>
            <button type="button" onClick={() => setShowCreateWallet(false)}>Annuler</button>
          </form>
        </div>
      )}

      {/* Actions de dépôt, retrait et transfert */}
      {wallet && (
        <div className="wallet-actions">
          <div className="action">
            <h3>Dépôt</h3>
            <input
              type="number"
              placeholder="Montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={handleDeposit}>Déposer</button>
          </div>

          <div className="action">
            <h3>Retrait</h3>
            <input
              type="number"
              placeholder="Montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={handleWithdraw}>Retirer</button>
          </div>

          <div className="action">
            <h3>Transfert</h3>
            <input
              type="number"
              placeholder="Montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              type="text"
              placeholder="ID du portefeuille destinataire"
              value={receiverWalletId}
              onChange={(e) => setReceiverWalletId(e.target.value)}
            />
            <button onClick={handleTransfer}>Transférer</button>
          </div>
        </div>
      )}

      {/* Historique des transactions */}
      {wallet && (
        <div className="transaction-history">
          <h3>Historique des Transactions</h3>
          {transactions.length > 0 ? (
            <ul>
              {transactions.map((transaction) => (
                <li key={transaction._id} className="transaction-item">
                  <span className="transaction-date">
                    {new Date(transaction.date).toLocaleDateString()}
                  </span>
                  <span className={`transaction-amount ${transaction.type === "income" ? "income" : "expense"}`}>
                    {transaction.type === "income" ? "+" : "-"} {transaction.amount} {wallet.currency}
                  </span>
                  <span className="transaction-description">
                    {transaction.description || "Aucune description"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-transactions">Aucune transaction trouvée.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Wallet;