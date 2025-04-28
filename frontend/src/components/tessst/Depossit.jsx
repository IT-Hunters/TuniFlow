import React, { useState } from "react";
import axios from "axios";
import "./Tessst.css";

const Deposit = ({ goBack, walletId }) => {
  const [amount, setAmount] = useState("");
  const [isTaxable, setIsTaxable] = useState(false);
  const [vatRate, setVatRate] = useState(0.19); // Taux par défaut
  const [message, setMessage] = useState("");

  const handleDeposit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Vous devez être connecté pour effectuer un dépôt.");
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
        `http://localhost:3000/transactions/deposit/${walletId}`,
        {
          amount: parseFloat(amount),
          is_taxable: isTaxable,
          vat_rate: isTaxable ? parseFloat(vatRate) : 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(`Dépôt réussi ! Nouveau solde : ${response.data.newBalance}`);
      setAmount("");
      setIsTaxable(false);
      setVatRate(0.19);
      setTimeout(goBack, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur lors du dépôt");
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h2>Deposit</h2>
        <button className="back-button" onClick={goBack}>
          Return
        </button>
      </div>

      <div className="form-container">
        <label>
          Amount :
          <input
            type="number"
            placeholder="Enter the amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Soumis à la TVA :
          <input
            type="checkbox"
            checked={isTaxable}
            onChange={(e) => setIsTaxable(e.target.checked)}
          />
        </label>
        {isTaxable && (
          <label>
            Taux de TVA :
            <select value={vatRate} onChange={(e) => setVatRate(e.target.value)}>
              <option value="0.19">19%</option>
              <option value="0.07">7%</option>
              <option value="0.13">13%</option>
              <option value="0">0%</option>
            </select>
          </label>
        )}
        <button className="submit-button" onClick={handleDeposit}>
          Deposit
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default Deposit;