import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Tessst.css";

const Transfer = ({ goBack, walletId }) => {
  const [amount, setAmount] = useState("");
  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [message, setMessage] = useState("");
  const [walletData, setWalletData] = useState(null);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Vous devez être connecté pour récupérer les données du wallet.");
        return;
      }

      const response = await axios.get("http://localhost:3000/wallets/getWallets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const wallet = response.data.find((wallet) => wallet._id === walletId);
      setWalletData(wallet);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur lors de la récupération des données du wallet");
    }
  };

  useEffect(() => {
    if (walletId) {
      fetchWalletData();
    }
  }, [walletId]);

  const handleTransfer = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Vous devez être connecté pour effectuer un transfert.");
        return;
      }

      if (!walletId || !receiverWalletId) {
        setMessage("ID du portefeuille manquant.");
        return;
      }

      if (!amount || amount <= 0) {
        setMessage("Le montant doit être supérieur à 0.");
        return;
      }

      const response = await axios.post(
        `http://localhost:3000/transactions/transfer/${walletId}/${receiverWalletId}`,
        { amount: parseFloat(amount) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(`Transfert réussi ! Nouveau solde : ${response.data.senderTransaction.balanceAfterTransaction}`);
      setAmount("");
      setReceiverWalletId("");
      setTimeout(goBack, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur lors du transfert");
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="wallet-container">
          <div className="wallet-header">
            <h2>Transfer</h2>
            <button className="back-button" onClick={goBack}>
              return
            </button>
          </div>

          <div className="form-container">
            {/* Afficher l'ID du wallet comme les autres champs */}
            <label>
              ID du wallet :
              <input
                type="text"
                value={walletData ? walletData._id : "Chargement..."}
                readOnly
                className="readonly-input"
              />
            </label>
            <label>
              Montant :
              <input
                type="number"
                placeholder="Entrez le montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              ID du destinataire :
              <input
                type="text"
                placeholder="Entrez l'ID du portefeuille"
                value={receiverWalletId}
                onChange={(e) => setReceiverWalletId(e.target.value)}
              />
            </label>
            <button className="submit-button" onClick={handleTransfer}>
              Transférer
            </button>
            {message && <p className="message">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;