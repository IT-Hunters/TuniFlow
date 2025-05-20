import React, { useState, useEffect } from "react";
//import axios from "axios";
import axios from '@/axios'
import "./Tessst.css";
import Swal from "sweetalert2";

const Transfer = ({ goBack, walletId }) => {
  const [amount, setAmount] = useState("");
  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [isTaxable, setIsTaxable] = useState(false);
  const [vatRate, setVatRate] = useState(0.19); // Taux par défaut
  const [message, setMessage] = useState("");
  const [walletData, setWalletData] = useState(null);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Vous devez être connecté pour récupérer les données du wallet.");
        return;
      }

      const response = await axios.get("/wallets/getWallets", {
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
        `/transactions/transfer/${walletId}/${receiverWalletId}`,
        {
          amount: parseFloat(amount),
          is_taxable: isTaxable,
          vat_rate: isTaxable ? parseFloat(vatRate) : 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.fraud) {
        Swal.fire({
          icon: "warning",
          title: "Fraud Alert",
          text: response.data.message || "Suspicious transaction detected!",
        });
        setMessage("");
        return;
      }

      setMessage(`Transfert réussi ! Nouveau solde : ${response.data.senderTransaction.balanceAfterTransaction}`);
      setAmount("");
      setReceiverWalletId("");
      setIsTaxable(false);
      setVatRate(0.19);
      setTimeout(goBack, 2000);
    } catch (error) {
      if (error.response?.data?.fraud) {
        Swal.fire({
          icon: "warning",
          title: "Fraud Alert",
          text: error.response.data.message || "Suspicious transaction detected!",
        });
        setMessage("");
      } else {
        setMessage(error.response?.data?.message || "Erreur lors du transfert");
      }
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h2>Transfer</h2>
        <button className="back-button" onClick={goBack}>
          Return
        </button>
      </div>

      <div className="form-container">
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
          ID Recipient :
          <input
            type="text"
            placeholder="Entrez l'ID du portefeuille"
            value={receiverWalletId}
            onChange={(e) => setReceiverWalletId(e.target.value)}
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
        <button className="submit-button" onClick={handleTransfer}>
          Transfer
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default Transfer;