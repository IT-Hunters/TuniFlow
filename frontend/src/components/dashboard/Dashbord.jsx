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
              <div className="card" style={{display: 'flex'}}>
             <div><img src={customer} alt="Logo" className="icon" /></div> 
             <div>
                <h3>Customers</h3>
                <p>1,456</p>
                <small>+ 56 last week</small>
              </div>
              </div>

              <div className="card" style={{display: 'flex'}}>
              <div><img src={revenue} alt="Logo" className="iconrevenue" /></div> 
              <div style={{marginLeft: '50px'}}>
                <h3>Revenue</h3>
                <p>$23k</p>
                <small>+ 2.3k last week</small>
              </div>
              </div>
              
              <div className="card" style={{display: 'flex'}}>
              <div><img src={profit} alt="Logo" className="iconrevenue" /></div> 
              <div style={{marginLeft: '50px'}}>
                <h3>Profit</h3>
                <p>60%</p>
                <small>+ 6% last week</small>
              </div>
              </div>
              <div className="card" style={{display: 'flex'}}>
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
              <div className="chart-box">
                <h4>Invoice Statistics</h4>
                <div ><img src={chart}  className="chart" />
                </div>
              </div>
              
              <div className="chart-box">
                <h4>sales Statistics</h4>
                <div ><img src={chart2}  className="chart" />
                </div>
              </div>
            </div>
            {/* Recent Invoices */}
            <div className="recent-invoices">
              <h4>Recent Invoices</h4>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer Name</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#045699</td>
                    <td>Eren Yeager</td>
                    <td>1 x Black Backpack</td>
                    <td>07/12/2022</td>
                    <td><span className="status paid">Paid</span></td>
                    <td>$100</td>
                  </tr>
                  <tr>
                    <td>#045700</td>
                    <td>Levi Ackerman</td>
                    <td>2 x T-Shirts</td>
                    <td>08/12/2022</td>
                    <td><span className="status pending">Pending</span></td>
                    <td>$45</td>
                  </tr>
                  <tr>
                    <td>#045701</td>
                    <td>Mikasa Ackerman</td>
                    <td>1 x Jacket</td>
                    <td>09/12/2022</td>
                    <td><span className="status refunded">Refunded</span></td>
                    <td>$75</td>
                  </tr>
                  <tr>
                    <td>#045702</td>
                    <td>Historia Reiss</td>
                    <td>2 x Bags</td>
                    <td>10/12/2022</td>
                    <td><span className="status paid">Paid</span></td>
                    <td>$120</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashbord;
