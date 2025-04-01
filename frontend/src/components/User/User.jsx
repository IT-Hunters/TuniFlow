// User.jsx
import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import StatsCards from "./StatsCards/StatsCards";
import TransactionChart from "./TransactionChart/TransactionChart";
import ProjectsOverview from "./ProjectOverview/ProjectsOverview";
import EventCalendar from "./EventCalender/EventCalendar";
import RecentInvoices from "./RecentInvoices/RecentInvoices";
import TeamActivity from "./TeamActivities/TeamActivity";
import RoleSelector from "./RoleSelector/RoleSelector";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import "./User.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function User() {
  const [selectedRole, setSelectedRole] = useState("all");

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <Dashboard selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
      </div>
    </div>
  );
}

export function TransactionList({ walletId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!walletId) return;
      walletId = "67d15c34ea844b95d23a1788";
      setLoading(true);
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() + (6 - now.getDay())));

      try {
        const response = await axios.get(
          `http://localhost:3000/transactions/getTransactions/${walletId}`,
          {
            params: {
              startDate: startOfWeek.toISOString(),
              endDate: endOfWeek.toISOString(),
            },
          }
        );
        setTransactions(response.data);
      } catch (err) {
        setError("Error fetching transactions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [walletId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!transactions.length) return <p>No transactions this week.</p>;

  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const data = {
    labels: sortedTransactions.map(t => new Date(t.date).toLocaleString()),
    datasets: [{
      label: "Transactions",
      data: sortedTransactions.map(t => (t.type === "income" ? t.amount : -t.amount)),
      backgroundColor: sortedTransactions.map(t => (t.type === "income" ? "#4caf50" : "#f44336")),
    }],
  };

  return (
    <div className="transaction-list">
      <h4>Weekly Activity</h4>
      <Bar data={data} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}

function Dashboard({ selectedRole, setSelectedRole }) {
  return (
    <div className="main-panel">
      <div className="content-wrapper">
        {/* Row 1: StatsCards (full width) */}
        <div className="row">
          <div className="col-lg-12 grid-margin stretch-card">
            <StatsCards />
          </div>
        </div>

        {/* Row 2: TransactionChart + ProjectsOverview */}
        <div className="row equal-height-row">
          <div className="col-lg-6 grid-margin stretch-card">
            <TransactionChart />
          </div>
          <div className="col-lg-6 grid-margin stretch-card">
            <div className="dashboard-section">
              <RoleSelector selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
              <ProjectsOverview selectedRole={selectedRole} />
            </div>
          </div>
        </div>

        {/* Row 3: EventCalendar + TeamActivity */}
        <div className="row equal-height-row">
          <div className="col-lg-6 grid-margin stretch-card">
            <EventCalendar />
          </div>
          <div className="col-lg-6 grid-margin stretch-card">
            <TeamActivity />
          </div>
        </div>

        {/* Row 4: RecentInvoices (full width) */}
        <div className="row">
          <div className="col-lg-12 grid-margin stretch-card">
            <RecentInvoices />
          </div>
        </div>
      </div>
    </div>
  );
}