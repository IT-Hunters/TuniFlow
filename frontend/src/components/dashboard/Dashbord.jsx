import  { useState, useEffect } from "react";
import "./Dashbord.css";
import customer from "./assets/customer.png";
import revenue from "./assets/revenue.png";
import profit from "./assets/profit.png";
import expenses from "./assets/expenses.png";
import chart2 from "./assets/chart2.png";
import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import axios from "axios";
import UsersTable from "./UsersTable/UsersTable";
import ConnectedUsers from "../ConnectedUsers/ConnectedUsers";
import LoginChart from "../GetDailyLogins/getDailyLogins"

const Dashbord = () => {
  const [topProjects, setTopProjects] = useState([]);

  // Fetch top projects when the component mounts
  useEffect(() => {
    const fetchTopProjects = async () => {
      try {
        const response = await axios.get("http://localhost:3000/wallets/top-projects");
        setTopProjects(response.data);
      } catch (error) {
        console.error("Error fetching top projects:", error);
      }
    };
    fetchTopProjects();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      <div className="container">
        <Sidebar />
        <div className="main">
          <Navbar />
          <div className="content">
            {/* Stat Cards */}
            <div className="stats-cards">
              <div className="card-dashboard" style={{ display: "flex" }}>
                <div>
                  <img src={customer} alt="Customer Icon" className="icon" />
                </div>
                <div>
                  <h3>Customers</h3>
                  <p>1,456</p>
                  <small>+ 56 last week</small>
                </div>
              </div>
              <div className="card-dashboard" style={{ display: "flex" }}>
                <div>
                  <img src={revenue} alt="Revenue Icon" className="iconrevenue" />
                </div>
                <div style={{ marginLeft: "50px" }}>
                  <h3>Revenue</h3>
                  <p>$23k</p>
                  <small>+ 2.3k last week</small>
                </div>
              </div>
              <div className="card-dashboard" style={{ display: "flex" }}>
                <div>
                  <img src={profit} alt="Profit Icon" className="iconrevenue" />
                </div>
                <div style={{ marginLeft: "50px" }}>
                  <h3>Profit</h3>
                  <p>60%</p>
                  <small>+ 6% last week</small>
                </div>
              </div>
              <div className="card-dashboard" style={{ display: "flex" }}>
                <div>
                  <img src={expenses} alt="Expenses Icon" className="iconexpenses" />
                </div>
                <div style={{ marginLeft: "40px" }}>
                  <h3>Expenses</h3>
                  <p>1,345</p>
                  <small>+ 145 last week</small>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts">
            <div className="chart-box">
              <h4>Top Projects</h4>
              <ul>
                {topProjects.map((project) => (
                  <li key={project._id}>
                    Business Manager: {project.businessManager?.fullname ?? 'N/A'} - Balance: {project.wallet?.balance ?? 'N/A'} TND
                  </li>
                ))}
              </ul>
            </div>
                  <LoginChart/>
              <UsersTable/>
              <ConnectedUsers/>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashbord;