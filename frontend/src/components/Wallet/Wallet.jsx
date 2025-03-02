import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./wallet.css";

const Wallet = () => {
  const { walletId } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newWalletData, setNewWalletData] = useState({ type: "" });

  useEffect(() => {
    if (walletId) {
      const fetchWallet = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`http://localhost:5000/wallet/${walletId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWallet(response.data);
        } catch (error) {
          console.error("Erreur lors de la récupération du wallet :", error);
        } finally {
          setLoading(false);
        }
      };
      fetchWallet();
    } else {
      setLoading(false); // Mode création
    }
  }, [walletId]);

  const handleCreateWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = JSON.parse(atob(token.split(".")[1])).userId;
      const response = await axios.post(
        "http://localhost:5000/wallet",
        { user_id: userId, type: newWalletData.type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWallet(response.data.wallet);
      navigate(`/wallet/${response.data.wallet._id}`);
    } catch (error) {
      console.error("Erreur lors de la création du wallet :", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="wallet-container">
      {wallet ? (
        <div className="wallet-card">
          <h2>{wallet.type}</h2>
          <p className="balance">{wallet.balance} {wallet.currency}</p>
          <button onClick={() => navigate(`/transactions/${wallet._id}`)}>
            Voir les transactions
          </button>
          <button onClick={() => navigate(`/wallet/${wallet._id}/deposit`)}>Dépôt</button>
          <button onClick={() => navigate(`/wallet/${wallet._id}/withdraw`)}>Retrait</button>
        </div>
      ) : (
        <div className="wallet-create">
          <h2>Créer un nouveau portefeuille</h2>
          <input
            type="text"
            placeholder="Type de portefeuille (ex: Principal)"
            value={newWalletData.type}
            onChange={(e) => setNewWalletData({ ...newWalletData, type: e.target.value })}
          />
          <button onClick={handleCreateWallet}>Créer</button>
        </div>
      )}
    </div>
  );
};

export default Wallet;