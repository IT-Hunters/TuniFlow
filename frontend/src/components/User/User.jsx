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
import { useNavigate } from "react-router-dom";
import StatsCards from "./StatsCards/StatsCards";
import TransactionChart from "./TransactionChart/TransactionChart";
import ProjectsOverview from "./ProjectOverview/ProjectsOverview";
import EventCalendar from "./EventCalender/EventCalendar";
import InvoiceAnalytics from "./InvoiceAnalytics/InvoiceAnalytics";
import TeamActivity from "./TeamActivities/TeamActivity";
import RoleSelector from "./RoleSelector/RoleSelector";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import "./User.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const API_USERS = 'http://localhost:3000/users';

export default function Dashboard() {
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState(localStorage.getItem('selectedProjectId') || '');
  const [projects, setProjects] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const walletId = "68112d12b7a83867f82846ea";
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch projects
  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
       // const role = localStorage.getItem("role")
        setUserRole(localStorage.getItem("role"));
        setLoading(true);
        const response = await axios.get(`${API_USERS}/findMyProject2`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const projectData = Array.isArray(response.data) ? response.data : [response.data];
        
        if (projectData.length > 0) {
          setProjects(projectData);
          // If no project is selected, set the first project as default
          if (!selectedProjectId && projectData.length > 0) {
            const defaultProjectId = projectData[0].id;
            setSelectedProjectId(defaultProjectId);
            localStorage.setItem('selectedProjectId', defaultProjectId);
          }

        } else {
          setError('No projects found. Please create a project to view objectives.');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to fetch projects: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchMyProjects();
  }, [selectedProjectId]);

  // Handle project selection change
  const handleProjectChange = (e) => {
    const newProjectId = e.target.value;
    setSelectedProjectId(newProjectId);
    localStorage.setItem('selectedProjectId', newProjectId);
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="main-panel">
          <div className="content-wrapper">
            {/* Row 1: StatsCards (full width) */}
              <div className="row">
                <h2 className="section-title">Overview Across All Projects Owned</h2>
                <div className="col-lg-12 grid-margin stretch-card">
                  <StatsCards />
                </div>
              </div>

            {/* Row 2: Project Selection */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="project-selection">
                  <h3>Dive Into Projects Global Overview</h3>
                  <h2>Select Project</h2>
                  {loading ? (
                    <p>Loading projects...</p>
                  ) : error ? (
                    <p className="error">{error}</p>
                  ) : (
                    <select
                      value={selectedProjectId}
                      onChange={handleProjectChange}
                      className="project-selector"
                    >
                      <option value="">Select a project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name} (Owner: {project.businessOwner?.fullname || 'Unknown'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: TransactionChart + ProjectsOverview */}
            <div className="row equal-height-row">
              <div className="col-md-6 col-lg-6 grid-margin stretch-card">
                <TransactionChart walletId={walletId} />
              </div>
              <div className="col-md-6 col-lg-6 grid-margin stretch-card">
                <div className="dashboard-section">
                  <RoleSelector selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
                  {selectedProjectId ? (
                    <ProjectsOverview projectId={selectedProjectId} />
                  ) : (
                    <p>Please select a project to view objectives.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: EventCalendar + TeamActivity */}
            <div className="row equal-height-row">
              <div className="col-md-6 col-lg-6 grid-margin stretch-card">
                <EventCalendar />
              </div>
              <div className="col-md-6 col-lg-6 grid-margin stretch-card">
                <TeamActivity projectId={selectedProjectId} />
              </div>
            </div>

            {/* Row 5: InvoiceAnalytics */}
            <div className="row">
              <div className="col-lg-12 grid-margin stretch-card">
                <InvoiceAnalytics />
              </div>
            </div>
          </div>
        </div>
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

  if (loading) return <div className="loading-indicator">Loading...</div>;
  if (error) return <p className="error">{error}</p>;
  if (!transactions.length) return <p className="no-data">No transactions this week.</p>;

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
      <Bar data={data} options={{ 
        responsive: true, 
        maintainAspectRatio: false,
        scales: { 
          y: { beginAtZero: true } 
        } 
      }} />
    </div>
  );
}
