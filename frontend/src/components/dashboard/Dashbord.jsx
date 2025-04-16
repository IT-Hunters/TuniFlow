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
  const token = localStorage.getItem("token");
  // Fetch top projects when the component mounts
  useEffect(() => {
    const fetchTopProjects = async () => {
      try {
        const response = await axios.get("http://localhost:3000/wallets/top-projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTopProjects(response.data);
      } catch (error) {
        console.error("Error fetching top projects:", error);
      }
    };
    fetchTopProjects();
  }, []);

  return (
    <>
      <div className="container">
        <Sidebar />
        <div className="main">
          <Navbar />
          <div className="content">
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