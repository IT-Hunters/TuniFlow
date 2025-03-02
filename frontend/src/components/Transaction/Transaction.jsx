import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
 // Réutilisation du même CSS

const Transaction = () => {
  const { walletId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/transactions/${walletId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des transactions :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [walletId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="wallet-container">
      <h2>Transactions</h2>
      {transactions.length > 0 ? (
        <ul className="transaction-list">
          {transactions.map((tx) => (
            <li key={tx._id} className={`transaction-item ${tx.type}`}>
              <span>{tx.type === "income" ? "Dépôt" : "Retrait"}</span>
              <span>{tx.amount} {tx.currency || "TND"}</span>
              <span>{new Date(tx.date).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucune transaction trouvée</p>
      )}
    </div>
  );
};

export default Transaction;