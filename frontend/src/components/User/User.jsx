import { useState } from "react";
import  StatsCards  from "./StatsCards/StatsCards";
import  TransactionChart  from "./TransactionChart/TransactionChart";
import  ProjectsOverview  from "./ProjectOverview/ProjectsOverview.jsx";
import  EventCalendar  from "./EventCalender/EventCalendar";
import  RecentInvoices  from "./RecentInvoices/RecentInvoices";
import  TeamActivity  from "./TeamActivities/TeamActivity";
import  RoleSelector  from "./RoleSelector/RoleSelector";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import "../../components/assetActif/assetActifComponent.css";
import "./User.css"; 

export default function User() {
  const [selectedRole, setSelectedRole] = useState("all");

  return (
    <div>
      <div className="container">
        <CoolSidebar />
        <div className="main">
          <Navbar />
          <div className="main-panel">
            <div className="content-wrapper">
              {/* Financial Overview (Full Width) */}
              <div className="row">
                <div className="col-lg-12 grid-margin stretch-card">
                  <div className="assetcard">
                    <div className="card-body">
                      <h4 className="card-title">Financial Overview</h4>
                      <StatsCards />
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Overview and Projects Overview (Side by Side) */}
              <div className="row equal-height-row">
                <div className="col-lg-6 grid-margin stretch-card">
                  <div className="assetcard">
                    <div className="card-body">
                      <h4 className="card-title">Revenue Overview</h4>
                      <TransactionChart />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 grid-margin stretch-card">
                  <div className="assetcard scrollable-card">
                    <div className="card-body">
                      <h4 className="card-title">Projects Overview</h4>
                      <RoleSelector selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
                      <ProjectsOverview selectedRole={selectedRole} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Calendar and Team Activity (Side by Side) */}
              <div className="row equal-height-row">
                <div className="col-lg-6 grid-margin stretch-card">
                  <div className="assetcard scrollable-card">
                    <div className="card-body">
                      <h4 className="card-title">Event Calendar</h4>
                      <EventCalendar />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 grid-margin stretch-card">
                  <div className="assetcard scrollable-card">
                    <div className="card-body">
                      <h4 className="card-title">Team Activity</h4>
                      <TeamActivity />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Invoices (Full Width) */}
              <div className="row">
                <div className="col-lg-12 grid-margin stretch-card">
                  <div className="assetcard">
                    <div className="card-body">
                      <h4 className="card-title">Recent Invoices</h4>
                      <RecentInvoices />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}