import React, { useState } from "react";
import axios from "axios";
import "./Tessst.css";

const Transfer = ({ goBack, walletId }) => {
  const [amount, setAmount] = useState("");
  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [message, setMessage] = useState("");

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
        `http://localhost:5000/transactions/transfer/${walletId}/${receiverWalletId}`,
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
            <label>
            amount :
              <input
                type="number"
                placeholder="Enter the amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              ID du destinataire :
              <input
                type="text"
                placeholder="Enter the wallet ID"
                value={receiverWalletId}
                onChange={(e) => setReceiverWalletId(e.target.value)}
              />
            </label>
            <button className="submit-button" onClick={handleTransfer}>
              Transfer
            </button>
            {message && <p className="message">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;