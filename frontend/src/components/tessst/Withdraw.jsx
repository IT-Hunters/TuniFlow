import React, { useState } from "react";
import axios from "axios";
import "./Tessst.css";

const Withdraw = ({ goBack, walletId }) => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleWithdraw = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Vous devez être connecté pour effectuer un retrait.");
        return;
      }

      if (!walletId) {
        setMessage("ID du portefeuille manquant.");
        return;
      }

      if (!amount || amount <= 0) {
        setMessage("Le montant doit être supérieur à 0.");
        return;
      }

      const response = await axios.post(
        `http://localhost:3000/transactions/withdraw/${walletId}`,
        { amount: parseFloat(amount) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(`Retrait réussi ! Nouveau solde : ${response.data.newBalance}`);
      setAmount("");
      setTimeout(goBack, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur lors du retrait");
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="wallet-container">
          <div className="wallet-header">
            <h2>withdraw</h2>
            <button className="back-button" onClick={goBack}>
              Return
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
            <button className="submit-button" onClick={handleWithdraw}>
              Withdraw
            </button>
            {message && <p className="message">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;