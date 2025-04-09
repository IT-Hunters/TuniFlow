import { useState, useEffect } from "react";
import "./Dashbord.css";
import customer from "./assets/customer.png";
import revenue from "./assets/revenue.png";
import profit from "./assets/profit.png";
import expenses from "./assets/expenses.png";
import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import axios from "axios";
import UsersTable from "./UsersTable/UsersTable";
import ConnectedUsers from "../ConnectedUsers/ConnectedUsers";
import LoginChart from "../GetDailyLogins/getDailyLogins";

const Dashbord = () => {
  const [topProjects, setTopProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get("http://localhost:3000/wallets/top-projects");
        setTopProjects(response.data);
      } catch (error) {
        console.error("Error fetching top projects:", error);
        setError("Failed to load top projects. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopProjects();
  }, []);

  // Function to format the balance with commas
  const formatBalance = (balance) => {
    if (balance === undefined || balance === null) return "N/A";
    return balance.toLocaleString("en-US");
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          {/* Stat Cards */}
          <div className="stats-cards">
            <div className="card-dashboard">
              <img src={customer} alt="Customer Icon" className="icon" />
              <div className="card-content">
                <h3>Customers</h3>
                <p>1,456</p>
                <small>+ 56 last week</small>
              </div>
            </div>
            <div className="card-dashboard">
              <img src={revenue} alt="Revenue Icon" className="iconrevenue" />
              <div className="card-content">
                <h3>Revenue</h3>
                <p>$23k</p>
                <small>+ 2.3k last week</small>
              </div>
            </div>
            <div className="card-dashboard">
              <img src={profit} alt="Profit Icon" className="iconrevenue" />
              <div className="card-content">
                <h3>Profit</h3>
                <p>60%</p>
                <small>+ 6% last week</small>
              </div>
            </div>
            <div className="card-dashboard">
              <img src={expenses} alt="Expenses Icon" className="iconexpenses" />
              <div className="card-content">
                <h3>Expenses</h3>
                <p>1,345</p>
                <small>+ 145 last week</small>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts">
            <div className="chart-box">
              <h4>Top Performing Business Managers</h4>
              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : topProjects.length > 0 ? (
                <ul>
                  {topProjects.map((project) => (
                    <li key={project._id}>
                      Business Manager: {project.businessManager?.fullname ?? "N/A"}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty">No top projects available.</div>
              )}
            </div>
            <LoginChart />
            <UsersTable />
            <ConnectedUsers />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashbord;