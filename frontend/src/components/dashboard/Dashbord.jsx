//import React from 'react'
import './Dashbord.css'
import customer from './assets/customer.png'
import revenue from './assets/revenue.png'
import profit from './assets/profit.png'
import expenses from './assets/expenses.png'
import chart from './assets/chart.png'
import chart2 from './assets/chart2.png'
import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import UsersTable from './UsersTable/UsersTable'
import ConnectedUsers from '../ConnectedUsers/ConnectedUsers';
import LoginChart from '../GetDailyLogins/getDailyLogins';
const Dashbord = () => {
  // Vous pouvez déplacer ce CSS dans un fichier .css séparé
  

  return (
    <>
      {/* On insère le CSS via un <style> */}
      {/*<style dangerouslySetInnerHTML={{ __html: css }} />*/}

      {/* Le HTML principal du dashboard */}
      <div className="container">
        {/* Sidebar */}
        <Sidebar /> 


        {/* Main Content */}
        <div className="main">
          {/* Navbar */}
          <Navbar />

          {/* Contenu */}
          <div className="content">
            {/* Stat Cards */}
            <div className="stats-cards">
              <div className="card-dashboard" style={{display: 'flex'}}>
             <div><img src={customer} alt="Logo" className="icon" /></div> 
             <div>
                <h3>Customers</h3>
                <p>1,456</p>
                <small>+ 56 last week</small>
              </div>
              </div>

              <div className="card-dashboard" style={{display: 'flex'}}>
              <div><img src={revenue} alt="Logo" className="iconrevenue" /></div> 
              <div style={{marginLeft: '50px'}}>
                <h3>Revenue</h3>
                <p>$23k</p>
                <small>+ 2.3k last week</small>
              </div>
              </div>
              
              <div className="card-dashboard" style={{display: 'flex'}}>
              <div><img src={profit} alt="Logo" className="iconrevenue" /></div> 
              <div style={{marginLeft: '50px'}}>
                <h3>Profit</h3>
                <p>60%</p>
                <small>+ 6% last week</small>
              </div>
              </div>
              <div className="card-dashboard" style={{display: 'flex'}}>
              <div><img src={expenses} alt="Logo" className="iconexpenses" /></div> 
              <div style={{marginLeft: '40px'}}>
            
                <h3>Expenses</h3>
                <p>1,345</p>
                <small>+ 145 last week</small>
            </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts">
              <LoginChart/>
              <div className="chart-box">
                <h4>sales Statistics</h4>
                <div ><img src={chart2}  className="chart" />
                </div>
              </div>
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
